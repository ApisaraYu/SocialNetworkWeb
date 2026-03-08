import React from 'react'
import logo from './assets/Socialio_logo.png'

function App() {
  return (
    <body class="bg-slate-100"> {/* เปลี่ยนสี bg เป็น slate-100 */}
      <div class="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm"> {/* สร้างแทบ nav bar ขึ้นมา */}
        <div class="text-3xl font-extrabold font-sans text-cyan-700 flex items-center gap-2">
          <img class="object-cover h-20" src={logo}/>Socialio
        </div>
      </div>
    </body>
  )
}
export default App
