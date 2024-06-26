import {
  computed,
  type ObservablePrimitiveBaseFns,
  type ObservablePrimitiveBooleanFns,
} from "@legendapp/state";
import { Switch, useObservable } from "@legendapp/state/react";
import {
  Button,
  Flex,
  Select,
  Switch as SwitchButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import t from "@src/shared/config";
import { globalState$, peerState$ } from "@src/shared/state";
import { motion } from "framer-motion";
import { Folder, Laptop, Phone, X } from "lucide-react";
import { useCallback } from "react";
import About from "./about";

type SettingsProps = {
  settings: ObservablePrimitiveBaseFns<boolean> &
    ObservablePrimitiveBooleanFns<boolean>;
};

export default function Settings({ settings }: SettingsProps) {
  const view = useObservable<"advanced" | "files" | "transfers">("transfers");
  const isAdvancedMode = useObservable(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute z-20 w-full h-screen flex items-center justify-center shadow-xl"
    >
      <Flex className="w-5/6 h-4/6 bg-light-1 dark:bg-dark-8 rounded-lg overflow-hidden border-1 border-solid border-zinc-200 dark:border-zinc-800">
        {/* sidebar */}
        <Flex
          direction="column"
          align="start"
          justify="between"
          className="w-2/6 h-full bg-white dark:bg-dark-7 border-r-1 border-r-solid border-r-zinc-200 dark:border-r-zinc-800"
        >
          <Flex direction="column" align="start" className="w-full">
            <Flex align="center" justify="start" className="px-3 py-2">
              <Button
                onClick={() => settings.set(false)}
                variant="ghost"
                color="tomato"
                className="w-2.5 h-4.5 rounded-full cursor-pointer"
              >
                <X />
              </Button>
            </Flex>
            <Flex direction="column" align="start" className="w-full" grow="1">
              <Flex
                onClick={() => view.set("transfers")}
                className="w-full px-2 py-2 cursor-pointer hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40"
              >
                <Text
                  color={view.get() === "transfers" ? "blue" : "gray"}
                  className="text-[12.5px]"
                >
                  Transfers
                </Text>
              </Flex>
              <Flex
                onClick={() => view.set("files")}
                className="w-full px-2 py-2 cursor-pointer hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40"
              >
                <Text
                  color={view.get() === "files" ? "blue" : "gray"}
                  className="text-[12.5px]"
                >
                  Files & Folders
                </Text>
              </Flex>
              {/* TODO show and hide with advanced mode status */}
              <Flex
                onClick={() => view.set("advanced")}
                className="w-full px-2 py-2 cursor-pointer hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40"
              >
                <Text
                  color={view.get() === "advanced" ? "blue" : "gray"}
                  size="2"
                  className="text-[12.5px]"
                >
                  Advanced
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex className="px-3 py-2 w-full" align="center" justify="between">
            <About />
            <Flex align="end" gap="2">
              <Text className="text-[10px] font-medium" color="gray">
                Advanced Mode
              </Text>
              <SwitchButton
                size="1"
                onClick={() => isAdvancedMode.set(!isAdvancedMode.get())}
                checked={isAdvancedMode.get()}
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex className="w-4/6 h-full px-3 py-3">
          <Switch value={view.get()}>
            {{
              advanced: () => <Advanced />,
              transfers: () => <Transfers />,
              files: () => <Files />,
            }}
          </Switch>
        </Flex>
      </Flex>
    </motion.div>
  );
}

function Files() {

  const {mutate:changeFolder}=t.files.changeDestination.useMutation({
    onSuccess:(d)=>{
      if(d.cancelled || d.path===null) return;
      globalState$.destinationPath.set(d.path)
    }
  })

  return (
    <Flex className="w-full h-full" direction="column" gap="5" align="start">
      <Flex className="w-full" direction="column" gap="2">
        <Flex className="w-full" align="center" justify="between">
          <Flex direction="column" align="start">
            <Text className="font-bold text-[12px]">Destination directory</Text>
            <Text className="text-zinc-400 text-[11.5px]">
              Change what folder recieved files are saved to
            </Text>
          </Flex>
          <Button
            variant="surface"
            color="gray"
            size="1"
            className="cursor-pointer"
            onClick={()=>changeFolder()}
          >
            <Flex align="center" justify="start" gap="1">
              <Folder size={10} />
              <Text size="1">Select Folder</Text>
            </Flex>
          </Button>
        </Flex>
        <Text className="text-[10px] text-zinc-500">
          Current Directory: {globalState$.destinationPath.get()}
        </Text>
      </Flex>
    </Flex>
  );
}

function Advanced() {

  const newPort=useObservable<string|null>(null);

  const changedPort=computed(()=>newPort.get()===null);

  const saveNewPort=useCallback(()=>{
    if(newPort.get()===null) return;
    globalState$.port.set(+newPort.get()!);
  },[])

  return (
    <Flex className="w-full h-full" direction="column" align="start" gap="5">
      <Flex align="center" className="w-full" justify="between">
        <Flex direction="column" align="start">
          <Text className="text-[12px] font-bold">Server Port</Text>
          <Text className="text-[11px] text-zinc-400">
            Port for apollo server. Make sure destination device port is the
            same.
          </Text>
        </Flex>
        <TextField.Root className="max-w-[4.5rem]">
          <TextField.Slot>
            {peerState$.deviceType.get() === "desktop" ? (
              <Laptop size={9} />
            ) : (
              <Phone />
            )}
          </TextField.Slot>
          <TextField.Input
            size="1"
            defaultValue={globalState$.port.get()}
            onChange={(e) => newPort.set(e.currentTarget.value)}
          />
        </TextField.Root>
      </Flex>
    </Flex>
  );
}

function Transfers() {
  return (
    <Flex direction="column" align="start" gap="5" className="w-full h-full">
      <Flex className="w-full" align="center" justify="between">
        <Flex direction="column" align="start">
          <Text className="font-bold text-[12px]">Transfer history</Text>
          <Text className="text-zinc-400 text-[11.5px]">
            View transfers incoming and outgoing on this device
          </Text>
        </Flex>
        <SwitchButton
          size="1"
          onClick={() =>
            globalState$.transferHistory.set(
              !globalState$.transferHistory.get(),
            )
          }
          checked={globalState$.transferHistory.get()}
        />
      </Flex>
      <Flex className="w-full" align="center" justify="between">
        <Flex direction="column" align="start">
          <Text className="font-bold text-[12px]">Save transfer history</Text>
          <Text className="text-zinc-400 text-[11.5px]">
            Transfer history save duration
          </Text>
        </Flex>
        <Select.Root size="1" defaultValue="3D">
          <Select.Trigger
            radius="large"
            disabled={!globalState$.transferHistory.get()}
            className="bg-light-1 dark:bg-dark-8 cursor-pointer"
          />
          <Select.Content
            variant="soft"
            defaultValue="4D"
            className="flex flex-col items-start bg-light-1 dark:bg-dark-8"
          >
            <Select.Item
              disabled={!globalState$.transferHistory.get()}
              className="cursor-pointer"
              value="none"
            >
              <Text>None</Text>
            </Select.Item>
            <Select.Item
              disabled={!globalState$.transferHistory.get()}
              className="cursor-pointer"
              value="1D"
            >
              <Text>1 Days</Text>
            </Select.Item>
            <Select.Item
              disabled={!globalState$.transferHistory.get()}
              className="cursor-pointer"
              value="2D"
            >
              <Text>2 Days</Text>
            </Select.Item>
            <Select.Item
              disabled={!globalState$.transferHistory.get()}
              className="cursor-pointer"
              value="3D"
            >
              <Text>3 Days</Text>
            </Select.Item>
            <Select.Item
              disabled={!globalState$.transferHistory.get()}
              className="cursor-pointer"
              value="4D"
            >
              <Text>4 Days</Text>
            </Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>
    </Flex>
  );
}
