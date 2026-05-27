import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  children: ReactNode;
  className?: string;
};

/** Rounded card with premium light surface and shadow. */
export function PremiumCard({ children, className, ...rest }: Props) {
  return (
    <View
      className={['rounded-3xl border border-gray-100 bg-white shadow-md shadow-black/8', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}>
      {children}
    </View>
  );
}
