import type { ToolCategory } from '@/lib/types';
import {
  CompressIcon,
  ConvertIcon,
  ImageIcon,
  SparkleIcon,
  type IconProps,
} from '@/components/ui/icons';

/** One icon per tool category (cards, menus). */
export function CategoryIcon({ category, ...props }: IconProps & { category: ToolCategory }) {
  switch (category) {
    case 'compress':
      return <CompressIcon {...props} />;
    case 'convert':
      return <ConvertIcon {...props} />;
    case 'favicon':
      return <SparkleIcon {...props} />;
    default:
      return <ImageIcon {...props} />;
  }
}
