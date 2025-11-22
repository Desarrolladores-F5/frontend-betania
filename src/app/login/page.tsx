"use client";

import React, { useEffect, useState } from "react";
import LoginForm from "@/components/auth/LoginForm";

/**
 * LoginPage (vertical y centrada)
 * - Marca (logo + títulos + saludo dinámico) centrada arriba
 * - Tarjeta de login centrada debajo
 * - Footer fijo abajo (usa .login-footer desde globals.css)
 */

function getGreetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function LoginPage() {
  const [greeting, setGreeting] = useState<string>(() => getGreetingForHour(new Date().getHours()));

  useEffect(() => {
    const timer = setInterval(() => {
      const h = new Date().getHours();
      setGreeting(getGreetingForHour(h));
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="login-hero">
      <div className="login-container">
        {/* Marca / encabezado */}
        <header className="brand-wrap" aria-hidden>
          {/* Ubica tu logo en /public/logo-betania.png */}
          <img src="/logo-betania.png" alt="Fundación Betania - Logo" className="brand-logo" />
          <h1 className="brand-title">
            Plataforma Educativa
            <br />
            Fundación Betania Acoge
          </h1>

          {/* Saludo dinámico (mismo porte visual) */}
          <div className="brand-subtitle--greeting" aria-hidden>
            <span className="greeting-strong">{greeting}</span>
            <span className="greeting-sub"> — Bienvenido</span>
          </div>
        </header>

        {/* Card de login (centrada) */}
        <aside className="login-aside" role="region" aria-label="Formulario de ingreso">
          <div className="login-card">
            <h2 className="card-heading">INGRESA TU USUARIO Y CONTRASEÑA</h2>
            <p className="card-sub">Accede al panel</p>

            <div className="form-stack">
              <LoginForm />
            </div>
          </div>
        </aside>
      </div>

      {/* Footer fijo (usa estilos .login-footer / .login-footer-inner en globals.css) */}
      <footer className="login-footer" aria-label="Pie de página">
        <div className="login-footer-inner">
          Diseñado y creado por: <strong>UpF5</strong>. Visítanos en{" "}
          <a href="https://www.upf5.com" target="_blank" rel="noopener noreferrer">www.upf5.com</a>
        </div>
      </footer>
    </main>
  );
}
