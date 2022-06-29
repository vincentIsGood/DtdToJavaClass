import {ClassGenerator,XmlDtdExtractor} from "./DtdToJavaClassCore.mjs";
import {readFileSync} from "fs";

// `JMdict_e` file is not uploaded to github.
let extractor2 = new XmlDtdExtractor(new TextDecoder().decode(readFileSync("./JMdict_e")));
extractor2.extractEntities();
extractor2.extractDefinitions();
extractor2.linkDefinitions();

let generator2 = new ClassGenerator(extractor2);
console.log(generator2.generate());

/*
final Map<String, String> ENTITY_DEFINITIONS = new HashMap<>();
{
ENTITY_DEFINITIONS.put("hob", "Hokkaido-ben");
ENTITY_DEFINITIONS.put("ksb", "Kansai-ben");
ENTITY_DEFINITIONS.put("ktb", "Kantou-ben");
...
}
class JMdict{
    Entry entry;
}
class Entry{
    String ent_seq;
    K_ele k_ele;
    R_ele r_ele;
    Sense sense;
}
class ...
...
*/