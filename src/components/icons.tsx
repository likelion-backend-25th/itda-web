import type { ReactNode } from 'react'

type IconProps = {
  className?: string
}

function Icon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function CloseIcon() {
  return (
    <Icon>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </Icon>
  )
}

export function SearchIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16.5 4.5 4.5" />
    </Icon>
  )
}

export function BellIcon() {
  return (
    <Icon>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Icon>
  )
}

export function MailIcon() {
  return (
    <Icon>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  )
}

export function LockIcon() {
  return (
    <Icon>
      <rect x="6" y="10.5" width="12" height="8.5" rx="2" />
      <path d="M8.5 10.5V8.2a3.5 3.5 0 0 1 7 0v2.3" />
    </Icon>
  )
}

export function EyeOffIcon() {
  return (
    <Icon>
      <path d="M4 5.5 19.5 19" />
      <path d="M9.2 9.6A3.2 3.2 0 0 0 12 15.2c.7 0 1.3-.2 1.8-.6" />
      <path d="M6.4 7.4C4.4 8.8 3 11.1 2.6 12c0 0 3.6 5.4 9.4 5.4 1.2 0 2.4-.2 3.4-.7" />
      <path d="M10.4 6.9c.5-.2 1-.3 1.6-.3 5.8 0 9.4 5.4 9.4 5.4a13 13 0 0 1-2.1 2.7" />
    </Icon>
  )
}

export function ChevronDownIcon() {
  return (
    <Icon>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  )
}

export function ChevronUpIcon() {
  return (
    <Icon>
      <path d="m6 15 6-6 6 6" />
    </Icon>
  )
}

export function PencilIcon() {
  return (
    <Icon>
      <path d="M12.5 20.5h8" />
      <path d="M16.2 3.8a2.2 2.2 0 0 1 3.1 3.1L8.2 18.1 4 19.2l1.1-4.2Z" />
    </Icon>
  )
}

export function HomeIcon() {
  return (
    <Icon>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1Z" />
    </Icon>
  )
}

export function SendIcon() {
  return (
    <Icon>
      <path d="M21 4 3.5 10.2 10 13l2.8 6.5L21 4Z" />
      <path d="M10 13 21 4" />
    </Icon>
  )
}

export function UserIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.2 19.4c1.3-3 3.7-4.5 6.8-4.5s5.5 1.5 6.8 4.5" />
    </Icon>
  )
}

export function BagIcon() {
  return (
    <Icon>
      <path d="M6.5 8h11l-.8 11.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8Z" />
      <path d="M9 8V7.2A3 3 0 0 1 15 7.2V8" />
    </Icon>
  )
}

export function SubscribeIcon() {
  return (
    <Icon>
      <path d="M7 4.8h10a1 1 0 0 1 1 1V19l-6-3.2L6 19V5.8a1 1 0 0 1 1-1Z" />
    </Icon>
  )
}

export function GridIcon() {
  return (
    <Icon>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
    </Icon>
  )
}

export function CraftIcon() {
  return (
    <Icon>
      <path d="M12 3.5 20 12 12 20.5 4 12Z" />
      <path d="M12 8.5v7" />
      <path d="M8.5 12h7" />
    </Icon>
  )
}

export function GlobeIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2.3 2.3 3.4 5 3.4 8s-1.1 5.7-3.4 8c-2.3-2.3-3.4-5-3.4-8s1.1-5.7 3.4-8Z" />
    </Icon>
  )
}

export function UsersIcon() {
  return (
    <Icon>
      <circle cx="9" cy="8.2" r="2.3" />
      <circle cx="15.6" cy="9" r="1.8" />
      <path d="M4.6 17.4c.9-2.3 2.7-3.4 4.4-3.4s3.5 1.1 4.4 3.4" />
      <path d="M13.6 14.4c1.3-.3 2.6 0 3.5 1.2.7 1 1.1 2.2 1.3 3" />
    </Icon>
  )
}

export function ImageIcon() {
  return (
    <Icon>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.3" />
      <path d="m7 16 3.1-3a1 1 0 0 1 1.4 0L16.5 17" />
    </Icon>
  )
}

export function GearIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.8v2.1M12 18.1v2.1M3.8 12h2.1M18.1 12h2.1M6.2 6.2l1.5 1.5M16.3 16.3l1.5 1.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5" />
    </Icon>
  )
}

export function FolderIcon() {
  return (
    <Icon>
      <path d="M4 8.2V7.4A1.6 1.6 0 0 1 5.6 5.8h3.2l1.4 1.6h8.2A1.6 1.6 0 0 1 20 9v7.2a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 16.2V8.2Z" />
    </Icon>
  )
}

export function HeadsetIcon() {
  return (
    <Icon>
      <path d="M4.5 13V12a7.5 7.5 0 0 1 15 0v1" />
      <rect x="3.5" y="13" width="4" height="6.5" rx="1.4" />
      <rect x="16.5" y="13" width="4" height="6.5" rx="1.4" />
    </Icon>
  )
}

export function DotsIcon() {
  return (
    <Icon>
      <circle cx="6" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function CommentIcon() {
  return (
    <Icon>
      <path d="M6.2 17.2 4.2 20.4V7.6A2.4 2.4 0 0 1 6.6 5.2h10.8A2.4 2.4 0 0 1 19.8 7.6v6.6a2.4 2.4 0 0 1-2.4 2.4H6.2Z" />
    </Icon>
  )
}

export function EyeIcon() {
  return (
    <Icon>
      <path d="M2.6 12S6.2 6.6 12 6.6 21.4 12 21.4 12 17.8 17.4 12 17.4 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </Icon>
  )
}

type ToggleIconProps = {
  filled?: boolean
}

export function HeartIcon({ filled = false }: ToggleIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.2s-6.8-4.2-6.8-9.1A3.9 3.9 0 0 1 12 8.2a3.9 3.9 0 0 1 6.8 2.9c0 4.9-6.8 9.1-6.8 9.1Z" />
    </svg>
  )
}

export function BookmarkIcon({ filled = false }: ToggleIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4.8h10a1 1 0 0 1 1 1V19l-6-3.2L6 19V5.8a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

export function UtensilsIcon() {
  return (
    <Icon>
      <path d="M8 4v7" />
      <path d="M6 4v5.5a2 2 0 0 0 4 0V4" />
      <path d="M8 11v9" />
      <path d="M16 4c1.4 1.8 2 3.6 2 5.8S17.2 14 16 14V4Z" />
      <path d="M16 14v6" />
    </Icon>
  )
}

export function PlaneIcon() {
  return (
    <Icon>
      <path d="M21 12 3.5 5.2l3.4 6.8-3.4 6.8L21 12Z" />
      <path d="M6.9 12h8.2" />
    </Icon>
  )
}

export function ForkKnifeIcon() {
  return (
    <Icon>
      <path d="M7 3.5v6" />
      <path d="M5.2 3.5v3.2a1.8 1.8 0 0 0 3.6 0V3.5" />
      <path d="M7 9.5V20" />
      <path d="M16 3.5c1.6 1.7 2.3 3.2 2.3 5 0 1.8-1 3-2.3 3V3.5Z" />
      <path d="M16 11.5V20" />
    </Icon>
  )
}

export function FlightIcon() {
  return (
    <Icon>
      <path d="M21 14.6v-1.5l-7.4-4.6V4.2a1.3 1.3 0 0 0-2.6 0v4.3L3.6 13.1v1.5l7.4-2.2v4.4l-1.8 1.3v1.2l3.1-.9 3.1.9v-1.2l-1.8-1.3v-4.4Z" />
    </Icon>
  )
}

export function RunIcon() {
  return (
    <Icon>
      <circle cx="15.2" cy="4.6" r="1.6" />
      <path d="M4.8 16.8 9.6 17.8l.8-1.6" />
      <path d="M15.4 20.4v-3.8l-3.8-2.8 1-5.6" />
      <path d="M7.2 11.6V8.8h4.8l2.8 3.8 2.8.9" />
    </Icon>
  )
}

export function OpenBookIcon() {
  return (
    <Icon>
      <path d="M4 6.6c2.5-.9 4.8-.5 8 .9 3.2-1.4 5.5-1.8 8-.9V18c-2.5-.9-4.8-.5-8 .9-3.2-1.4-5.5-1.8-8-.9Z" />
      <path d="M12 7.5v11.4" />
    </Icon>
  )
}

export function ChefHatIcon() {
  return (
    <Icon>
      <path d="M7.6 12.8c-1.7 0-2.8-1.2-2.8-2.6 0-1.3 1-2.4 2.3-2.6.5-1.9 2.2-3.2 4.1-3 1.6.2 2.8 1.2 3.4 2.6 1.4 0 2.7.9 2.9 2.3.3 1.5-.9 2.8-2.4 3" />
      <path d="M8 12.8h8.2V18a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 18Z" />
    </Icon>
  )
}

export function NoteIcon() {
  return (
    <Icon>
      <path d="M9.2 17.6V5.8L18 4v11.2" />
      <circle cx="6.8" cy="17.6" r="2.4" />
      <circle cx="15.6" cy="15.2" r="2.4" />
    </Icon>
  )
}

export function DumbbellIcon() {
  return (
    <Icon>
      <path d="M6.5 8.5v7" />
      <path d="M4.2 10v4" />
      <path d="M8.8 7v10" />
      <path d="M8.8 12h6.4" />
      <path d="M15.2 7v10" />
      <path d="M19.8 10v4" />
      <path d="M17.5 8.5v7" />
    </Icon>
  )
}

export function BookIcon() {
  return (
    <Icon>
      <path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H20v16.2H6.2A2.2 2.2 0 0 0 4 21.4Z" />
      <path d="M4 5.2A2.2 2.2 0 0 1 6.2 7.4H20" />
    </Icon>
  )
}

export function PotIcon() {
  return (
    <Icon>
      <path d="M5 10.5h14v5.2a3.8 3.8 0 0 1-3.8 3.8H8.8A3.8 3.8 0 0 1 5 15.7Z" />
      <path d="M8.2 10.5V8.6a3.8 3.8 0 0 1 7.6 0v1.9" />
      <path d="M4 10.5h16" />
    </Icon>
  )
}

export function MusicIcon() {
  return (
    <Icon>
      <path d="M9 18.2V6.2l10-2v12" />
      <circle cx="6.5" cy="18.2" r="2.3" />
      <circle cx="16.5" cy="16.2" r="2.3" />
    </Icon>
  )
}

export function PaletteIcon() {
  return (
    <Icon>
      <path d="M12 4.2a7.8 7.8 0 1 0 0 15.6h1.2a1.8 1.8 0 0 0 0-3.6h-.6a1.6 1.6 0 0 1-1.6-1.6 5.2 5.2 0 0 1 5.2-5.2 1.8 1.8 0 0 0 1.6-2.7A7.7 7.7 0 0 0 12 4.2Z" />
      <circle cx="8.2" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11.2" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="9.2" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function GameIcon() {
  return (
    <Icon>
      <rect x="3" y="8" width="18" height="9.5" rx="4" />
      <path d="M8 11.2v4" />
      <path d="M6 13.2h4" />
      <circle cx="15.6" cy="12.2" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="17.6" cy="14" r="0.8" fill="currentColor" stroke="none" />
    </Icon>
  )
}
