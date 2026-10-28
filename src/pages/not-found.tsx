import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/button'

export function NotFound({ message = '这个页面不存在。' }: { message?: string }) {
  return <div className="page space-y-6">
    <h1>没有找到内容</h1>
    <p className="text-text-2">{message}</p>
    <Link className={buttonClass()} to="/">返回歌单墙</Link>
  </div>
}
