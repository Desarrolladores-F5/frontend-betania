"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function TestPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/auth/me", { withCredentials: true })
      .then(res => setData(res.data))
      .catch(err => setData({ error: err.response?.data || err.message }));
  }, []);

  return (
    <div className="p-6">
      <h1>Prueba de Sesión</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
