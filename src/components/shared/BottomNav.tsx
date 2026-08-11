'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Map, CalendarRange, User } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/map', icon: Map, label: 'Map' },
  { href: '/plan', icon: CalendarRange, label: 'Planning' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
      className="bottom-nav"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            style={{ position: 'relative' }}
          >
            {/* Animated active pill — slides between items via layoutId */}
            {isActive && (
              <motion.div
                layoutId="bottom-nav-pill"
                className="bottom-nav-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.85 }}
              transition={{ duration: 0.1 }}
              style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem' }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="bottom-nav-label">{item.label}</span>
            </motion.div>
          </Link>
        );
      })}
    </motion.nav>
  );
}
