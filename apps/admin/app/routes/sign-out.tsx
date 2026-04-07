import { SignOut as SignOutComponent } from '@repo/ui/sign-out';
import { useNavigate } from 'react-router';

export default function SignOut() {
    const navigate = useNavigate();

    return <SignOutComponent onSuccess={() => navigate('/sign-in')} />;
}
