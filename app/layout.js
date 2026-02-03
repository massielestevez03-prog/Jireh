import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'JIREH System | Cotizador',
  description: 'Sistema de Cotización Inmobiliaria Profesional',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        {children}
        {/* Scripts externos cargados de forma optimizada */}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
