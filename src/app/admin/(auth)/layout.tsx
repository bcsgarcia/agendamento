// Layout para rotas públicas dentro de /admin (login).
// Sobrescreve src/app/admin/layout.tsx que exige autenticação.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
