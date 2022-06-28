import rimraf from "rimraf";
import { getWorkspaces } from "react-native-monorepo-tools";
import { ungzip } from "pako";
import Listr from "listr";
import { resolve } from "path";
import { isYarnWorkspacesMonorepo } from "./workspaces";

/**
 * Display Header
 */
function cloud(): void {
  const gzippedData = Buffer.from(
    "H4sIAJQcFFwAA11NQQrDMAy7+xW6NYHiPKAv2B8CTgeBHsYKbcbopW+fHRraTrYSI0UO0CBgsbOvEzXZCTo4JMCrzSL+sJyWtRrK5O1uphOxYE2zqtb9GbX3+56ibmYEG0+jYjD+aUEZSa4IAv0o3jSy2KN0K8qUMb9fG77jhjLjmbF+lsxE9APlrOhe9gAAAA==",
    "base64"
  );
  const unzipedData = ungzip(gzippedData);
  console.log("\n");
  console.log(new TextDecoder().decode(unzipedData));
}

function promisedRimraf(rmPath: string): Promise<unknown> {
  return new Promise(resolve => {
    rimraf(rmPath, resolve);
  });
}

export function clean(cwd = "."): Promise<void> {
  // Display Header
  cloud();

  const cleanRootNmTask = {
    title: "Removing Root node_modules",
    task: () => promisedRimraf(resolve(cwd, "node_modules")),
  };

  const cleanYarnLock = {
    title: "Removing Root yarn.lock",
    task: () => promisedRimraf(resolve(cwd, "yarn.lock")),
  };

  const tasks: Listr.ListrTask<void>[] = [cleanRootNmTask, cleanYarnLock];

  if (isYarnWorkspacesMonorepo(cwd)) {
    const workspaceNms = getWorkspaces({ cwd });

    const cleanWorkspaceNMTasks = workspaceNms.map(w => ({
      title: `${w}/node_modules`,
      task: () => promisedRimraf(resolve(w, "node_modules")),
    }));
    tasks.push(...cleanWorkspaceNMTasks);
  }

  const taskRunner = new Listr<void>([
    {
      title: "Removing Workspace Node_Modules & Root Lock File",
      task: () => {
        return new Listr(tasks, {
          concurrent: true,
        });
      },
    },
  ]);

  return taskRunner.run().catch(err => console.error(err));
}
