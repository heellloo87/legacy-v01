import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="p-6">
        <h1 className="text-3xl font-bold">
          Admin Dashboard
        </h1>
      </div>
    </ProtectedRoute>
  );
}
