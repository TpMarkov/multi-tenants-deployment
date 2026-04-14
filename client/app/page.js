import Link from 'next/link';
import { QrCode, UtensilsCrossed, Smartphone } from 'lucide-react';

const DEFAULT_PROPERTY_ID = process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID || 'sample-prop';
const DEFAULT_ROOM_ID = process.env.NEXT_PUBLIC_DEFAULT_ROOM_ID || '101';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 max-w-md w-full">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-100 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <UtensilsCrossed className="h-16 w-16 text-blue-600 relative" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Welcome</h1>
        <p className="text-slate-500 mb-10 text-lg leading-relaxed">
          Please scan the QR code located in your room to view the menu and place your order.
        </p>
        
        <div className="space-y-6 text-left mb-10">
          <div className="flex items-start gap-4">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Scan QR Code</p>
              <p className="text-sm text-slate-500">Find the QR code on your desk or nightstand.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Browse & Order</p>
              <p className="text-sm text-slate-500">Pick your favorites and customize your meal.</p>
            </div>
          </div>
        </div>
        
        {/* Only for development: Link to a sample room */}
        <div className="pt-6 border-t border-dashed border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-widest">Developer Preview</p>
          <Link 
            href={`/property/${DEFAULT_PROPERTY_ID}/room/${DEFAULT_ROOM_ID}`}
            className="inline-block w-full py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
          >
            Go to Sample Room 101
          </Link>
        </div>
      </div>
      
      <p className="mt-12 text-slate-400 text-xs font-medium">© 2026 Hospitality SaaS. All rights reserved.</p>
    </div>
  );
}
