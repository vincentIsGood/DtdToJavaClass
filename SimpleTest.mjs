import {ClassGenerator,XmlDtdExtractor} from "./DtdToJavaClassCore.mjs";

let extractor = new XmlDtdExtractor(`
    <!ELEMENT entry (ent_seq, k_ele*, r_ele+, sense+)>
    <!ELEMENT ent_seq (#PCDATA)>
    <!ELEMENT gloss (#PCDATA | pri)*>
    <!ENTITY hob "Hokkaido-ben">
    <!ENTITY ksb "Kansai-ben">
    <!ENTITY ktb "Kantou-ben">
    <!ENTITY kyb "Kyoto-ben">
    <!ENTITY asd-asd "test-ben">
`);
extractor.extractEntities();
extractor.extractDefinitions();
extractor.linkDefinitions();

let generator = new ClassGenerator(extractor);
console.log(generator.generate());

/* Final Result:
final Map<String, String> ENTITY_DEFINITIONS = new HashMap<>();
{
ENTITY_DEFINITIONS.put("hob", "Hokkaido-ben");
ENTITY_DEFINITIONS.put("ksb", "Kansai-ben");
ENTITY_DEFINITIONS.put("ktb", "Kantou-ben");
ENTITY_DEFINITIONS.put("kyb", "Kyoto-ben");
ENTITY_DEFINITIONS.put("asd-asd", "test-ben");
}
class Entry{
    String ent_seq;
    K_ele k_ele;
    R_ele r_ele;
    Sense sense;
}
*/