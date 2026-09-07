## Colors

- Primary: #1B6B3A (deep green — positive status, money, primary actions)
- Primary Dark: #14552E
- Primary Light: #E8F5EE
- Background: #F8F7F4 (off-white)
- Surface: #FFFFFF (white cards)
- Surface Alt: #F0EFEA (muted background for sections)
- Error: #B91C1C (red — destructive actions and errors only)
- Error Light: #FEF2F2
- Warning: #D97706 (amber — warnings, low stock)
- Warning Light: #FFFBEB
- Text Primary: #1A1A1A (dark charcoal)
- Text Secondary: #6B7280 (gray — muted text)
- Text Muted: #9CA3AF (light gray — captions)
- Border: #E5E5E5 (light gray dividers)
- Divider: #F0F0F0

## Semantic Color Usage

- Positive status (paid, in stock, profit): #1B6B3A
- Warning status (low stock, partial payment): #D97706
- Destructive status (cancelled, returned, delete): #B91C1C
- Neutral status (pending, archived): #6B7280
- Money amounts (positive): #1B6B3A
- Money amounts (negative/debt): #B91C1C

## Typography

- Font Family: System font stack (San Francisco on iOS, Roboto on Android)
- Heading 1: 28px, 700 weight, line-height 34px
- Heading 2: 22px, 600 weight, line-height 28px
- Heading 3: 18px, 600 weight, line-height 24px
- Body: 16px, 400 weight, line-height 22px (minimum body size)
- Body Large: 18px, 400 weight, line-height 24px
- Caption: 14px, 400 weight, line-height 18px
- Label: 14px, 600 weight, line-height 18px
- Money Display: 24px, 700 weight, line-height 30px
- Money Small: 16px, 600 weight, line-height 20px

## Spacing

- Base unit: 4px
- Values: 4, 8, 12, 16, 20, 24, 32, 40, 48px
- Screen padding: 16px horizontal, 16px vertical
- Card padding: 16px
- Card gap: 12px
- Form field gap: 16px

## Layout

- Mobile-first, optimized for compact Android devices (360px width)
- Safe-area aware (top and bottom insets)
- Bottom tab bar height: 60px + safe area bottom inset
- Header height: 56px + safe area top inset
- Max content width: 480px (centered on larger screens)
- Card border radius: 12px
- Button border radius: 10px
- Input border radius: 8px
- Card shadow: 0 1px 3px rgba(0,0,0,0.08)
- Card border: 1px solid #E5E5E5

## Components

- Primary Button: background #1B6B3A, text #FFFFFF, height 48px, border-radius 10px, font 16px/600
- Secondary Button: background transparent, border 1px #1B6B3A, text #1B6B3A, height 48px
- Destructive Button: background #B91C1C, text #FFFFFF, height 48px
- Disabled Button: background #D1D5DB, text #6B7280
- Input Field: border 1px #E5E5E5, border-radius 8px, height 48px, padding 12px, font 16px
- Input Error: border 1px #B91C1C, error text #B91C1C, font 14px
- Card: background #FFFFFF, border 1px #E5E5E5, border-radius 12px, padding 16px, shadow 0 1px 3px rgba(0,0,0,0.08)
- Badge (positive): background #E8F5EE, text #1B6B3A, border-radius 4px, padding 4px 8px, font 12px/600
- Badge (warning): background #FFFBEB, text #D97706, border-radius 4px, padding 4px 8px, font 12px/600
- Badge (destructive): background #FEF2F2, text #B91C1C, border-radius 4px, padding 4px 8px, font 12px/600
- Badge (neutral): background #F3F4F6, text #6B7280, border-radius 4px, padding 4px 8px, font 12px/600
- Tab Bar: background #FFFFFF, border-top 1px #E5E5E5, height 60px, 5 tabs
- Tab Item: icon 24px, label 12px, active color #1B6B3A, inactive color #6B7280
- Search Input: icon left, placeholder gray, border-radius 8px, height 44px
- List Row: padding 16px, border-bottom 1px #F0F0F0, min-height 56px
- Empty State: centered icon 48px, title 16px/600, subtitle 14px/400, padding 32px

## Direction

- Layout direction: LTR always
- Do not mirror or reverse layout for any language
- Arabic text may use text-align: right within individual text components
- Do not use flex-direction: row-reverse
- Tab order, card order, form order, navigation arrows remain LTR in all languages

## Currency

- Display format: "{amount} DZD" (e.g., "280 DZD")
- Arabic locale: "{amount} دج"
- Store internally as integer centimes
