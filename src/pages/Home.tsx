import { FaGithub, FaTwitter, FaInstagram, FaTelegramPlane } from 'react-icons/fa'
import { useEffect, useState } from 'react'

function Typewriter({ sequence, typingSpeed = 120, deletingSpeed = 80, pause = 800 }: { sequence: string[]; typingSpeed?: number; deletingSpeed?: number; pause?: number }) {
  const [value, setValue] = useState('')
  const [index, setIndex] = useState(0)
  const [pos, setPos] = useState(0)
  const [mode, setMode] = useState<'typing' | 'deleting'>('typing')
  useEffect(() => {
    const current = sequence[index % sequence.length]
    let t: ReturnType<typeof setTimeout>
    if (mode === 'typing') {
      if (pos < current.length) {
        t = setTimeout(() => {
          setPos(pos + 1)
          setValue(current.slice(0, pos + 1))
        }, typingSpeed)
      } else {
        t = setTimeout(() => setMode('deleting'), pause)
      }
    } else {
      if (pos > 0) {
        t = setTimeout(() => {
          setPos(pos - 1)
          setValue(current.slice(0, pos - 1))
        }, deletingSpeed)
      } else {
        t = setTimeout(() => {
          setIndex((index + 1) % sequence.length)
          setMode('typing')
        }, pause)
      }
    }
    return () => clearTimeout(t)
  }, [sequence, index, pos, mode, typingSpeed, deletingSpeed, pause])
  return (
    <span className="inline-block">
      {value}
      <span className="inline-block w-0.5 h-8 align-middle ml-1 bg-sky-500 animate-pulse"></span>
    </span>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-xl font-bold text-gray-800">Yanbo</div>
        <nav className="hidden md:flex space-x-8 text-gray-600">
          <a href="#" className="hover:text-gray-900">Favorites</a>
          <a href="#" className="hover:text-gray-900">Influencer</a>
          <a href="#" className="hover:text-gray-900">Code</a>
          <a href="#" className="hover:text-gray-900">Game</a>
          <a href="#" className="hover:text-gray-900">Music</a>
          <a href="#" className="hover:text-gray-900">Books</a>
        </nav>
        <div className="flex space-x-4">
          <a href="https://github.com/yanboishere" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900"><FaGithub size={20} /></a>
          <a href="https://x.com/YanboOfficial" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900"><FaTwitter size={20} /></a>
          <a href="https://t.me/yanbowang" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900"><FaTelegramPlane size={20} /></a>
          <a href="https://instagram.com/iam_yanbo" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900"><FaInstagram size={20} /></a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex items-center justify-center min-h-[calc(100vh-80px)] overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 opacity-50"></div>
        
        {/* Central Card */}
        <div className="relative bg-white p-10 rounded-xl shadow-lg max-w-md w-full text-center z-10">
          <p className="text-gray-500 text-sm mb-2">My name is:</p>
          <h2 className="text-4xl font-bold text-sky-500 mb-4 border-b-2 border-gray-300 pb-2 inline-block"><Typewriter sequence={["Yanbo", "烟波", "Yanbo", "烟波"]} typingSpeed={120} deletingSpeed={80} pause={800} /></h2>
          <p className="text-gray-500 text-sm mt-4 mb-2">I'm a:</p>
          <ul className="list-none p-0 m-0 text-gray-700 space-y-1">
            <li>Digital Nomad</li>
            <li>Web3 Community Operator (3+ years)</li>
            <li>Open Source Builder (5000+ GitHub stars)</li>
            <li>Hackathon Award Winner</li>
            <li>Remote · Global</li>
          </ul>
        </div>

        
      </main>
    </div>
  )
}