import { Text, TextProps } from './Themed';

/** Path / code snippets: same UI font as the rest of the app (no monospace “template” look). */
export function MonoText(props: TextProps) {
  return <Text {...props} />;
}
