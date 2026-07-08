import fs from "fs";

try {
  const hostsContent = fs.readFileSync("/etc/hosts", "utf8");
  const localDomains = "\n127.0.0.1 apex-tech.local summit-gadgets.local horizon-devices.local quantum-electronics.local neo-store.local\n";
  
  if (!hostsContent.includes("apex-tech.local")) {
    fs.appendFileSync("/etc/hosts", localDomains);
    console.log("Successfully appended local domains to /etc/hosts");
  } else {
    console.log("Local domains already present in /etc/hosts");
  }
} catch (error) {
  console.error("Error modifying /etc/hosts:", error);
}
