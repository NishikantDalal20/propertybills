export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  return <div className="p-8"><h1 className="text-2xl font-bold">Welcome, {user?.name}</h1></div>;
}