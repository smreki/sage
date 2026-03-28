import { Box, Text } from "ink";
import React from "react";

type BulletListProps = {
  items: Array<React.ReactNode>;
};

export function BulletList({ items }: BulletListProps) {
  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={index}>
          <Text>- </Text>
          <Text>{item}</Text>
        </Box>
      ))}
    </Box>
  );
}
