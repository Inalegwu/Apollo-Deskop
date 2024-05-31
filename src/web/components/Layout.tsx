import { useObserveEffect } from "@legendapp/state/react";
import { Button, Flex } from "@radix-ui/themes";
import { fileTransferState$, globalState$ } from "@shared/state";
import t from "@src/shared/config";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, History, Minus, Plus, Settings, X } from "lucide-react";
import type React from "react";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { mutate: minimizeWindow } = t.window.minimize.useMutation();
  const { mutate: closeWindow } = t.window.closeWindow.useMutation();

  const navState = useRouterState();

  const isHome = navState.location.pathname === "/";

  useObserveEffect(() => {
    if (globalState$.colorMode.get() === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  });

  const { mutate: selectFiles } = t.files.selectFiles.useMutation({
    onSuccess: (data) => {
      if (data.cancelled) return;

      fileTransferState$.files.set(data.data);
    },
  });

  return (
    <Flex
      width="100%"
      grow="1"
      direction="column"
      className="transition h-screen"
    >
      <Flex
        align="center"
        justify="between"
        gap="4"
        className="absolute z-10 w-full px-4 py-3 top-0 left-0"
      >
        {!isHome && (
          <Button
            variant="ghost"
            className="w-2.5 h-4.5 rounded-full cursor-pointer"
            asChild
          >
            <Link to="/">
              <ArrowLeft size={12} />
            </Link>
          </Button>
        )}
        <Flex grow="1" id="drag-region" className="p-2" />
        <Flex align="center" justify="end" gap="5">
          <Button
            onClick={() => minimizeWindow()}
            className="w-2.5 h-4.5 rounded-full cursor-pointer outline-none"
            color="gray"
            variant="ghost"
          >
            <Minus />
          </Button>
          <Button
            variant="ghost"
            onClick={() => closeWindow()}
            className="w-2.5 h-4.5 rounded-full cursor-pointer outline-none"
            color="tomato"
          >
            <X />
          </Button>
        </Flex>
      </Flex>
      {children}
      <Flex className="absolute bottom-1 right-1 space-x-3  rounded-lg p-3">
        <Button
          variant="soft"
          className="w-9 h-9 cursor-pointer rounded-full"
          asChild
        >
          <Link to="/history">
            <History size={13} />
          </Link>
        </Button>
        <Button
          variant="soft"
          onClick={() => selectFiles()}
          radius="full"
          className=" w-9 h-9 cursor-pointer"
        >
          <Plus size={13} />
        </Button>
        <Button
          variant="soft"
          radius="full"
          asChild
          className=" w-9 h-9 cursor-pointer rounded-full"
        >
          <Link to="/settings">
            <Settings size={13} />
          </Link>
        </Button>
      </Flex>
    </Flex>
  );
}
