import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ComponentProps } from 'react'
import { LogOut } from 'lucide-react'

type LogoutButtonProps = ComponentProps<typeof Button>

export function LogoutButton({ ...props }: LogoutButtonProps) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
		<Button
			className="shadow-lg shadow-primary/25 bg-red-500 text-white w-full"
			variant={"destructive"}
			onClick={logout}
			{...props}
		>
			<LogOut className="w-4 h-4 mr-2" /> Logout
		</Button>
	);
}
