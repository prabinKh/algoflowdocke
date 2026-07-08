import os
import django
import uuid
from django.utils.text import slugify

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixitall_backend.settings')
django.setup()

from company.models import Company
from efrontend.models import Category, Brand, Product

def seed_logitech():
    print("🚀 Starting Logitech seeding script...")
    
    # 1. Resolve Logitech Hub Company (slug: logitech)
    company = Company.objects.filter(slug="logitech").first()
    if not company:
        print("ℹ️ Logitech Hub not found by slug 'logitech', searching by name...")
        company = Company.objects.filter(name__icontains="Logitech").first()
    
    if not company:
        print("ℹ️ Still not found, creating new company...")
        company, _ = Company.objects.get_or_create(
            name="Logitech Hub",
            slug="logitech",
            defaults={
                "description": "Logitech Hub is a world leader in products that connect people.",
                "theme_color": "#00b2ef",
            }
        )
    else:
        print(f"✅ Found targeted company: {company.name}")

    # 1.5 Delete the duplicate "Logitech" company if it exists (the one I created by mistake)
    duplicates = Company.objects.filter(name="Logitech").exclude(pk=company.pk)
    if duplicates.exists():
        print(f"🗑️ Deleting {duplicates.count()} duplicate Logitech companies...")
        duplicates.delete()

    # 2. Delete specified Collections if they exist for this company
    from efrontend.models import Collection
    target_collections = ["Laptops", "Mobiles And Tablets", "Mobiles", "Tablets", "Laptop"]
    deleted_coll_count = 0
    for coll_name in target_collections:
        colls = Collection.objects.filter(company=company, name__iexact=coll_name)
        if colls.exists():
            colls.delete()
            deleted_coll_count += 1
            print(f"🗑️ Deleted collection: {coll_name}")
    
    if deleted_coll_count == 0:
        print("ℹ️ No matching collections found to delete.")

    # 3. Create/Resolve Brand "Logitech"
    brand = Brand.objects.filter(company=company, slug="logitech").first()
    if not brand:
        brand, _ = Brand.objects.get_or_create(
            company=company,
            name="Logitech",
            defaults={"description": "Official Logitech Brand"}
        )
    else:
        print(f"✅ Found existing brand: {brand.name}")

    # 4. Create Categories for Logitech products
    accessories_cat, _ = Category.objects.get_or_create(
        company=company,
        name="Computer Accessories",
        defaults={"description": "Mice, Keyboards, and more."}
    )
    
    gaming_cat, _ = Category.objects.get_or_create(
        company=company,
        name="Gaming",
        defaults={"description": "High-performance gaming gear."}
    )

    # 5. Add 5 Products
    products_data = [
        {
            "name": "Logitech MX Master 3S",
            "category": accessories_cat,
            "type": "Wireless Mouse",
            "description": "The iconic mouse remastered for ultimate precision and performance.",
            "details": "MX Master 3S is an iconic mouse remastered. Now with Quiet Clicks and 8K DPI any-surface tracking for more feel and performance than ever before.",
            "price": 99.99,
            "stock": 50,
            "is_popular": True,
            "image": "https://resource.logitech.com/w_1600,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png?v=1",
            "key_specifications": [
                "8000 DPI Tracking",
                "Quiet Click Switches",
                "MagSpeed Scrolling",
                "App-Specific Customizations",
                "USB-C Quick Charging"
            ],
            "detailed_specs": {
                "Sensor": "Darkfield high precision",
                "Buttons": "7 buttons",
                "Wireless distance": "10 m",
                "Battery": "Rechargeable Li-Po (500 mAh)"
            }
        },
        {
            "name": "Logitech G Pro X Superlight 2",
            "category": gaming_cat,
            "type": "Gaming Mouse",
            "description": "The next generation of our championship-winning gaming mouse.",
            "details": "Designed with the world's leading esports pros, the PRO X SUPERLIGHT 2 is engineered to help you win. It's the lightest, fastest PRO mouse ever.",
            "price": 159.00,
            "stock": 35,
            "is_new": True,
            "image": "https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight-2/gallery/pro-x-superlight-2-lightspeed-white-1.png?v=1",
            "key_specifications": [
                "60g Ultra Lightweight",
                "HERO 2 Sensor (32k DPI)",
                "LIGHTFORCE Hybrid Switches",
                "2000Hz Polling Rate",
                "95 Hours Battery Life"
            ],
            "detailed_specs": {
                "Sensor": "HERO 2",
                "Resolution": "100 – 32,000 DPI",
                "Max. acceleration": "> 40G",
                "Max. speed": "> 500 IPS"
            }
        },
        {
            "name": "Logitech G915 LIGHTSPEED",
            "category": gaming_cat,
            "type": "Mechanical Keyboard",
            "description": "Wireless mechanical gaming keyboard with low profile GL switches.",
            "details": "A breakthrough in design and engineering, now in black and white colorways. G915 features LIGHTSPEED pro-grade wireless, advanced LIGHTSYNC RGB, and new high-performance low-profile mechanical switches.",
            "price": 249.99,
            "stock": 20,
            "is_best_seller": True,
            "image": "https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/gaming/en/products/g915/g915-gallery-1.png?v=1",
            "key_specifications": [
                "LIGHTSPEED Wireless",
                "Low Profile Mechanical Switches",
                "Al-Mg Alloy Top Case",
                "Dedicated Media Controls",
                "30-hour Battery Life"
            ],
            "detailed_specs": {
                "Switch Type": "GL Tactile",
                "Actuation distance": "1.5 mm",
                "Actuation force": "50 g",
                "Total travel distance": "2.7 mm"
            }
        },
        {
            "name": "Logitech Brio 4K Ultra HD",
            "category": accessories_cat,
            "type": "Webcam",
            "description": "Our best webcam ever with 4K UHD and HDR support.",
            "details": "Step up to the world's most technologically advanced webcam and get professional-quality video for video conferencing, streaming, or recording.",
            "price": 199.00,
            "stock": 15,
            "image": "https://resource.logitech.com/w_1000,c_limit,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/webcams/brio/gallery/brio-gallery-1.png?v=1",
            "key_specifications": [
                "4K Ultra HD @ 30fps",
                "RightLight 3 with HDR",
                "Windows Hello Face Recognition",
                "5x Digital Zoom",
                "Dual Omnidirectional Mics"
            ],
            "detailed_specs": {
                "Resolution": "4K/30fps, 1080p/60fps",
                "Focus type": "Autofocus",
                "Diagonal field of view": "65\u00b0/78\u00b0/90\u00b0",
                "Digital zoom": "5x"
            }
        },
        {
            "name": "Logitech Zone Wireless 2",
            "category": accessories_cat,
            "type": "Headset",
            "description": "AI-powered headset for clear, noise-free calls.",
            "details": "Zone Wireless 2 is our top-of-the-line headset for the modern workspace. With AI noise suppression and advanced ANC, stay focused everywhere.",
            "price": 299.00,
            "stock": 10,
            "is_offer": True,
            "image": "https://resource.logitech.com/w_1000,c_limit,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/headsets/zone-wireless-2/gallery/zone-wireless-2-graphite-gallery-1.png?v=1",
            "key_specifications": [
                "AI Noise Suppression",
                "Hybrid ANC (4 Mics)",
                "Multipoint Bluetooth",
                "40 Hours Battery Life",
                "Comfortable Premium Design"
            ],
            "detailed_specs": {
                "Microphone Type": "5 Omni-directional",
                "Frequency response": "20-20kHz",
                "Wireless range": "Up to 50m",
                "Charging": "USB-C"
            }
        }
    ]

    for p_val in products_data:
        # Check if product already exists to avoid duplicates
        p_obj, p_created = Product.objects.get_or_create(
            company=company,
            slug=slugify(p_val["name"]),
            defaults={
                "name": p_val["name"],
                "category": p_val["category"],
                "brand": brand,
                "brand_name": brand.name,
                "type": p_val["type"],
                "description": p_val["description"],
                "details": p_val["details"],
                "price": p_val["price"],
                "stock": p_val["stock"],
                "image": p_val["image"],
                "key_specifications": p_val["key_specifications"],
                "detailed_specs": p_val["detailed_specs"],
                "is_popular": p_val.get("is_popular", False),
                "is_new": p_val.get("is_new", False),
                "is_best_seller": p_val.get("is_best_seller", False),
                "is_offer": p_val.get("is_offer", False),
            }
        )
        if p_created:
            print(f"✅ Created product: {p_obj.name}")
        else:
            print(f"ℹ️ Product already exists: {p_obj.name} - Updating specs...")
            p_obj.details = p_val["details"]
            p_obj.key_specifications = p_val["key_specifications"]
            p_obj.detailed_specs = p_val["detailed_specs"]
            p_obj.save()

    print("✨ Logitech seeding complete!")

if __name__ == "__main__":
    try:
        seed_logitech()
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
