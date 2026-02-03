import './globals.css'

export const metadata = {
  title: 'JIREH System',
  description: 'Sistema de Cotización Inmobiliaria',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" async></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
