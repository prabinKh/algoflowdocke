import AdminOrders from "../Orders";

const CancelledOrders = () => {
  return <AdminOrders filterStatus="cancelled" />;
};

export default CancelledOrders;
