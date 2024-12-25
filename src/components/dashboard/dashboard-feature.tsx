'use client'

import { AppHero } from '../ui/ui-layout'

const links: { label: string; href: string }[] = [
  { label: 'Project github', href: '(https://github.com/solana-turbin3/Q4_SOL_DanielB/tree/master/rs/src/programs/solana-ark-foundation' },
]

export default function DashboardFeature() {
  return (
    <div>
      <AppHero title="Solana Ark Foundation" subtitle="The time to act is now! ... before their silence becomes our legacy." />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2">
          {links.map((link, index) => (
            <div key={index}>
              <a href={link.href} className="link" target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
