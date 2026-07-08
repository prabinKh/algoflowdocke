import AdminOrders from "../Orders";

const ShippedOrders = () => {
  return <AdminOrders filterStatus="shipped" />;
};

export default ShippedOrders;
