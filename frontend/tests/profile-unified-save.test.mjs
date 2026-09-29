import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadProfileDataSource() {
  let source = await readFile(
    new URL("../src/features/profile/dataSource.ts", import.meta.url),
    "utf8",
  );
  source = source.replace(
    'import { repository } from "../../services/repository";',
    "const repository = {};",
  );
  source = source.replace(
    'import { serverMode } from "../../shared/http/client";',
    "const serverMode = true;",
  );
  source = source.replace(
    /import \{\s*isFandomCategoryId,\s*type FandomCategoryId,?\s*\} from "\.\.\/\.\.\/shared\/catalog\/taxonomy";/,
    "const isFandomCategoryId = (value) => Boolean(value);",
  );
  source = source.replace(
    'import { demo } from "../demo";',
    "const demo = {};",
  );
  source = source.replace(
    'import { profileApi } from "./api";',
    `const profileApi = {
      update: async (patch) => {
        globalThis.__profilePatches.push(patch);
        return { user: { ...patch, id: "user-1" } };
      },
      publicProfile: async () => null,
    };`,
  );

  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

test("unified server profile save sends personal fields and preserves display preferences", async () => {
  globalThis.__profilePatches = [];
  const { profileDataSource } = await loadProfileDataSource();
  const current = {
    id: "user-1",
    name: "Before",
    favorite_fandoms: [],
    display_preferences: { favoriteCategories: ["anime"] },
  };

  await profileDataSource.update(current, {
    name: "New name",
    favorite_fandoms: [" Fandom A "],
    phone: "+84987654321",
    birthday: "1990-02-03",
    gender: "female",
    city: "Hanoi",
    bio: "A short bio.",
  });

  assert.deepEqual(globalThis.__profilePatches, [
    {
      name: "New name",
      favorite_fandoms: ["Fandom A"],
      phone: "+84987654321",
      birthday: "1990-02-03",
      gender: "female",
      city: "Hanoi",
      bio: "A short bio.",
    },
  ]);
  assert.equal(
    Object.hasOwn(globalThis.__profilePatches[0], "display_preferences"),
    false,
  );
  delete globalThis.__profilePatches;
});
