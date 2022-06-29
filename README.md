# DTD to Java Class Generator
A very simple script used to generate simple java class from XML DTD definitions.

The written generator can currenly deal with `<!ELEMENT ...>` and `<!ENTITY ...>` only

Be sure to make reference to the tests. To run the test, simple do `node xxx.mjs`. Sample
output is shown in the test file.

## Example Usage
Currently, two types are required, `XmlDtdExtractor` and `ClassGenerator`. You would need
`XmlDtdExtractor` to extract definitions from an XML file then `ClassGenerator` to generate
Java class definitions.

Basic usage is shown here
```js
import {ClassGenerator,XmlDtdExtractor} from "./DtDToJavaClassCore.mjs";

const READ_FILE = "xxx.xml";

// Extract
let extractor = new XmlDtdExtractor(new TextDecoder().decode(readFileSync(READ_FILE)));
extractor.extractEntities();
extractor.extractDefinitions();
extractor.linkDefinitions();

// Generate
let generator = new ClassGenerator(extractor);
console.log(generator.generate());
```