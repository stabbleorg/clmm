import { createFromRoot } from 'codama';
import { rootNodeFromAnchor, AnchorIdl } from '@codama/nodes-from-anchor';
import { renderVisitor as renderJavaScriptVisitor } from "@codama/renderers-js";
import anchorIdl from '../idl/stabble_clmm.json';
import path from 'path';

const codama = createFromRoot(rootNodeFromAnchor(anchorIdl as AnchorIdl));
const sdkGeneratedPath = path.join(__dirname, "..", "src", "generated");
codama.accept(
  renderJavaScriptVisitor(sdkGeneratedPath)
);

console.log(`✅ Generated client to ${sdkGeneratedPath}`);
