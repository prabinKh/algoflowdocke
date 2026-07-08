import AdminOrders from "../Orders";

const PendingOrders = () => {
  return <AdminOrders filterStatus="pending" />;
};

export default PendingOrders;
