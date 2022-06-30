/**
 * References:
 * @see https://www.w3schools.com/xml/xml_dtd_elements.asp
 * @see https://www.w3schools.com/xml/xml_dtd_entities.asp
 */
import {inspect} from "util";

/**
 * The following code is poorly written. I wrote it just because I got tired 
 * of reading XML DTD definitions. I want the DTD thing to end ASAP and sleep.
 * @author Vincent
 */

/**
 * DTD = Document Type Definition
 * Tokenizes `<!ELEMENT >`
 */
class XmlDtdTokenizer{
    raw;
    currentIndex;
    peekedToken;

    /**
     * @param {string} raw 
     */
    constructor(raw){
        this.raw = raw;
        this.currentIndex = 0;
    }

    /**
     * The whole idea is whenever it encounter space, comma and what not, check if I have
     * string previously stored. If yes, return it first. This may not be the best one I 
     * have ever made. Maybe regex matching does a better job.
     */
    nextToken(){
        if(this.peekedToken != null){
            this.peekedToken = null;
            return this.peekedToken;
        }
        let tokenValue = "";
        while(this.currentIndex < this.raw.length){
            let currentChar = this.raw.charAt(this.currentIndex);
            if(this.ignorableChar(currentChar)){
                this.currentIndex++;
                while(this.ignorableChar(currentChar = this.raw.charAt(this.currentIndex)))
                    this.currentIndex++;
                if(tokenValue != "")
                    return tokenValue;
            }else if(currentChar == '"'){
                this.currentIndex++;
                while((currentChar = this.raw.charAt(this.currentIndex)) != '"' 
                && this.currentIndex < this.raw.length){
                    tokenValue += currentChar;
                    this.currentIndex++;
                }
                this.currentIndex++;
                return tokenValue;
            }else if(currentChar == '(' || currentChar == ')'){
                if(tokenValue.trim() != "")
                    return tokenValue;
                this.currentIndex++;
                return currentChar;
            }else if(currentChar == ','){
                this.currentIndex++;
                return tokenValue;
            }else{
                this.currentIndex++;
                tokenValue += currentChar;
            }
        }
        return null;
    }

    peekToken(){
        this.peekedToken = this.nextToken();
        return this.peekedToken;
    }

    ignorableChar(char){
        return char == ' ' || char == '!' || char == '<' || char == '>';
    }
}

class DependencyInfo{
    isArray;
    isOptional;
    /**
     * Let's say we have `(A | B)*` then we have an array with definition A, B.
     * But OR feature is not implemented. So, forget about it.
     * @type {ObjectDefinition[]}
     */
    dependency;

    constructor(){
        this.isArray = false;
        this.isOptional = false;
        this.dependency = [];
    }
}

class ObjectDefinition{
    /**
     * @type {string}
     */
    name;

    /**
     * `invalid` to indicate no dependencies
     * @type {{[name: string]: DependencyInfo}}
     */
    dependencies;

    constructor(name){
        this.name = name;
        this.dependencies = {};
    }
}

class EntityDefinition{
    /**
     * @type {string}
     */
    name;

    /**
     * @type {string}
     */
    value;

    constructor(name){
        this.name = name;
    }
}

/**
 * Extracts `<!ELEMENT >`
 */
class XmlDtdExtractor{
    /**
     * @param {string} text raw xml string.
     */
    constructor(text){
        this.text = text;

        /**
         * Act as a map
         * @type {{[name: string]: ObjectDefinition}}
         */
        this.definitions = {};
        /**
         * @type {EntityDefinition[]}
         */
        this.entities = [];
    }

    extractDefinitions(){
        let anchorIndex = this.text.indexOf("<!ELEMENT");
        let endTagIndex;
        while(anchorIndex != -1 && (endTagIndex = this.text.indexOf(">", anchorIndex)) != -1){
            endTagIndex++;
            let tokenizer = new XmlDtdTokenizer(this.text.substring(anchorIndex, endTagIndex));
            let nextToken = null;
            if((nextToken = tokenizer.nextToken()) != 'ELEMENT'){
                throw new TypeError("Invalid element definition: '" + nextToken + "'");
            }

            const defName = tokenizer.nextToken();
            if(defName == null) continue;
            let definition = new ObjectDefinition(defName);
            this.definitions[defName] = definition;
            // TODO: does not handle "|" (or) properly feel free to create a recursive function 
            // TODO: to return `child` whenever we encounter "(" inside children (child1, child2, ...)
            // TODO: we must not have another set of children then "(" means we may have "|" inside of 
            // TODO: it. We create `child` for each child already, so we just append the OR definition.
            //
            // Note: I just thought this OR thing is for ANY type which Java don't really have (except 
            //       for Object), skip this feature.
            if(tokenizer.nextToken() == '('){
                let openBrackets = 1;
                while(openBrackets > 0 && nextToken != null){
                    if((nextToken = tokenizer.nextToken()) == ')'){
                        openBrackets--;
                        continue;
                    }else if(nextToken == '('){
                        openBrackets++;
                        continue;
                    }
                    this.definitions[defName].dependencies[nextToken] = null;
                }
            }else{
                this.definitions[defName].dependencies[nextToken] = null;
            }

            anchorIndex = this.text.indexOf("<!ELEMENT", endTagIndex);
        }
    }

    extractEntities(){
        let anchorIndex = this.text.indexOf("<!ENTITY");
        let endTagIndex;
        while(anchorIndex != -1 && (endTagIndex = this.text.indexOf(">", anchorIndex)) != -1){
            endTagIndex++;
            let tokenizer = new XmlDtdTokenizer(this.text.substring(anchorIndex, endTagIndex));
            let nextToken = null;
            if((nextToken = tokenizer.nextToken()) != "ENTITY"){
                throw new TypeError("Invalid entity: '" + nextToken + "'");
            }

            let entity = new EntityDefinition(tokenizer.nextToken());
            if((nextToken = tokenizer.nextToken()) == "SYSTEM"){
                throw new Error("External Entity Declaration is not available");
            }else
                entity.value = nextToken;
            this.entities.push(entity);
            
            anchorIndex = this.text.indexOf("<!ENTITY", endTagIndex);
        }
    }

    linkDefinitions(){
        for(let definitionName in this.definitions){
            const objectDefinition = this.definitions[definitionName];
            for(let dependencyName in objectDefinition.dependencies){
                const dependencyInfo = new DependencyInfo();
                // Handle array, optional types (which should not belong here. Whatever.)
                if(dependencyName.endsWith("+") || dependencyName.endsWith("*")){
                    dependencyInfo.isArray = true;
                    dependencyName = dependencyName.substring(0, dependencyName.length-1);
                }else if(dependencyName.endsWith("?")){
                    dependencyInfo.isOptional = true;
                    dependencyName = dependencyName.substring(0, dependencyName.length-1);
                }

                if(dependencyName == "#PCDATA"){
                    objectDefinition.dependencies[dependencyName] = "invalid";
                    continue;
                }
                const dependency = objectDefinition.dependencies[dependencyName];
                if(dependency == null){
                    // find definition from main definitions list.
                    // console.log("For", dependencyName, "found?", this.definitions[dependencyName]);
                    dependencyInfo.dependency.push(this.definitions[dependencyName]);
                    objectDefinition.dependencies[dependencyName] = dependencyInfo;
                }
            }
        }
    }
}

class ClassGenerator{
    /**
     * @param {XmlDtdExtractor} processor 
     */
    constructor(processor){
        this.processor = processor;
    }

    /**
     * @returns {string} the generated java class returned as string.
     */
    generate(){
        let finalString = "";
        finalString += this.generateEntities();
        finalString += this.generateObjectClass();
        return finalString;
    }

    generateEntities(){
        let finalString = "final Map<String, String> ENTITY_DEFINITIONS = new HashMap<>();\n";
        finalString += "{\n";
        for(let entity of this.processor.entities){
            finalString += `ENTITY_DEFINITIONS.put("${entity.name}", "${entity.value}");\n`;
        }
        finalString += "}\n";
        return finalString;
    }

    generateObjectClass(){
        let validDefinitions = [];
        let finalString = "";
        for(let name in this.processor.definitions){
            let definition = this.processor.definitions[name];
            // console.log(name, definition.dependencies, definition.dependencies["#PCDATA"]);
            if(definition.dependencies["|"]){
                console.log("The following dependency may require manual check: ", definition);
            }
            if(definition.dependencies["#PCDATA"] != "invalid")
                validDefinitions.push(definition);
        }
        // console.log(validDefinitions);
        for(let def of validDefinitions){
            let classString = `class ${toUpperFirstChar(def.name)}{\n`;
            // console.log(def);
            for(let name in def.dependencies){
                const dependency = def.dependencies[name];
                if(dependency == null) continue;
                let arraySymbol = dependency.isArray? "[]" : "";
                if(dependency.dependency[0]?.dependencies["#PCDATA"] == "invalid"){
                    classString += `    String${arraySymbol} ${name};\n`;
                }else{
                    classString += `    ${toUpperFirstChar(name)}${arraySymbol} ${name};\n`;
                }
            }
            classString += "}\n"
            finalString += classString;
        }
        return finalString;
    }
}

/**
 * @param {string} str
 */
function toUpperFirstChar(str){
    let tail = str.substring(1);
    return str.charAt(0).toUpperCase() + tail;
}

function inspectObject(obj, depth = 4){
    console.log(inspect(obj, {showHidden: true, depth, colors: true}));
}

export {ClassGenerator,DependencyInfo,ObjectDefinition,XmlDtdExtractor,XmlDtdTokenizer};