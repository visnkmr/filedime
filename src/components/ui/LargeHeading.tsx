import { FC } from 'react';
import { cn } from './lib/utils';
import { cva, VariantProps } from 'class-variance-authority';

const headingVariants = cva(
  'font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl mb-10 antialiased',
  {
    variants: {
      size: {
        default: 'font-bold font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl',
        xlg: 'text-5xl md:text-6xl lg:text-7xl',
        sm: 'text-2xl md:text-3xl lg:text-4xl',
        lg: 'text-3xl md:text-3xl lg:text-4xl font-bold',
      },
      textColor: {
        default: 'text-gray-800',
      },
      align: {
        default: 'relative',
        center: 'text-center',
      },
      lineHeight: {
        '99': 'leading-99',
      },
    },
    defaultVariants: {
      size: 'default',
      textColor: 'default',
      align: 'default',
      lineHeight: '99',
    },
  }
);

interface LargeHeadingProps extends VariantProps<typeof headingVariants> {
  children: React.ReactNode;
  className?: string;
}

const LargeHeading: FC<LargeHeadingProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h1 {...props} className={cn(headingVariants(props), className)}>
      {children}
    </h1>
  );
};

export default LargeHeading;
