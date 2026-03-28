import { Box, Newline, Text } from "ink";
import React from "react";

type SectionProps = {
  title: string;
  icon?: string;
  titleColor?: string;
  children: React.ReactNode;
};

export function Section({ title, icon = ">", titleColor = "cyan", children }: SectionProps) {
  return (
    <Box
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      borderStyle="single"
      borderColor="#5a5a5a"
    >
      <Box flexDirection="column">
        <Text bold color={titleColor} backgroundColor="#202020">
          {icon} {title}
        </Text>
        <Text dimColor>---</Text>
      </Box>
      <Box flexDirection="column">
        {children}
      </Box>
    </Box>
  );
}
