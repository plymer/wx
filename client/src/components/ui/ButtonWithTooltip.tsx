import React from "react";
import Button, { ButtonProps } from "./Button";
import { Tooltip } from "./Tooltip";

interface Props extends ButtonProps {
  children: React.ReactNode;
  tooltipText: string;
}

const ButtonWithTooltip = ({ children, tooltipText, ...buttonProps }: Props) => {
  return (
    <Tooltip text={tooltipText}>
      <Button {...buttonProps}>{children}</Button>
    </Tooltip>
  );
};

export default ButtonWithTooltip;
