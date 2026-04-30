export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: 20,
      }}
    >
      {children}
    </main>
  )
}
