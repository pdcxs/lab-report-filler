import { invoke } from '@tauri-apps/api/core';
import type { Block, ImportedImage } from '../types/lab-config';
import { newUid } from './uid';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

const LANG_EXT_MAP: Record<string, string[]> = {
    // ================= 主流系统/编译型语言 =================
    java: ['java', 'jav'],
    python: ['py', 'pyw', 'pyi', 'rpy', 'gyp', 'gypi'],
    c: ['c', 'h', 'cats', 'idc'],
    cpp: ['cpp', 'c++', 'cc', 'cp', 'cxx', 'hpp', 'h++', 'hh', 'hxx', 'inc', 'inl', 'ino', 'ipp', 'ixx', 're', 'tcc', 'tpp'],
    csharp: ['cs', 'csx', 'cake', 'linq'],
    rust: ['rs', 'rlib'],
    go: ['go'],
    kotlin: ['kt', 'kts'],
    swift: ['swift'],
    objective_c: ['m', 'mm'],
    zig: ['zig'],
    nim: ['nim', 'nims'],
    crystal: ['cr'],
    d: ['d', 'di'],
    v: ['v', 'vsh'],
    assembly: ['asm', 's', 'S', 'nasm'],

    // ================= JVM & .NET 生态 =================
    scala: ['scala', 'sc'],
    groovy: ['groovy', 'gvy', 'gy', 'gsh'],
    clojure: ['clj', 'cljs', 'cljc', 'edn'],
    fsharp: ['fs', 'fsi', 'fsx', 'fsscript'],
    visual_basic: ['vb', 'vbs', 'bas', 'cls', 'frm', 'frx', 'vba', 'vbhtml'],

    // ================= 脚本与动态语言 =================
    javascript: ['js', 'mjs', 'cjs', 'jsx', 'es6', '_js', 'bones'],
    typescript: ['ts', 'tsx', 'mts', 'cts'],
    php: ['php', 'php3', 'php4', 'php5', 'phtml', 'ctp'],
    ruby: ['rb', 'rbx', 'rjs', 'gemspec', 'rake', 'erb', 'rhtml'],
    perl: ['pl', 'pm', 't', 'pod'],
    lua: ['lua', 'rockspec'],
    shell: ['sh', 'bash', 'zsh', 'fish', 'ksh', 'csh'],
    powershell: ['ps1', 'psm1', 'psd1'],
    batch: ['bat', 'cmd'],
    tcl: ['tcl', 'tk'],

    // ================= 函数式语言 =================
    haskell: ['hs', 'lhs'],
    elixir: ['ex', 'exs'],
    erlang: ['erl', 'hrl'],
    ocaml: ['ml', 'mli', 'mll', 'mly'],
    lisp: ['lisp', 'lsp', 'cl'],
    scheme: ['scm', 'ss', 'sls', 'sps'],
    racket: ['rkt', 'rktl'],
    julia: ['jl'],

    // ================= 数据、配置与序列化 =================
    json: ['json', 'jsonc', 'json5', 'geojson', 'topojson'],
    yaml: ['yml', 'yaml'],
    xml: ['xml', 'xsd', 'xsl', 'xslt', 'dtd', 'plist'],
    toml: ['toml'],
    ini: ['ini', 'cfg', 'conf', 'properties', 'gitconfig'],
    csv: ['csv', 'tsv'],
    sql: ['sql', 'ddl', 'dml'],
    graphql: ['graphql', 'gql'],
    protobuf: ['proto'],

    // ================= 标记与样式 =================
    html: ['html', 'htm', 'xhtml', 'shtml', 'mdoc', 'jsp', 'asp', 'aspx', 'jshtm'],
    css: ['css', 'scss', 'sass', 'less'],
    markdown: ['md', 'markdown', 'mdown', 'mkdn', 'mkd', 'mdwn', 'mdtxt', 'mdtext'],
    mdx: ['mdx'],
    latex: ['tex', 'ltx', 'sty', 'cls'],
    rst: ['rst'],

    // ================= 构建、基础设施与 DevOps =================
    dockerfile: ['dockerfile', 'containerfile'],
    terraform: ['tf', 'tfvars', 'hcl'],
    cmake: ['cmake', 'cmake.in'],
    makefile: ['mk', 'mak', 'make'],
    nginx: ['nginx', 'nginxconf'],
    apache: ['htaccess', 'htpasswd'],

    // ================= 其他领域特定语言 =================
    solidity: ['sol'],
    verilog: ['v', 'vh', 'sv', 'svh'], // 注意：.v 与 V 语言冲突
    vhdl: ['vhd', 'vhdl'],
    matlab: ['m'], // 注意：.m 与 Objective-C 冲突
    r: ['r', 'rhistory', 'rmd', 'rprofile', 'rt'],
    dart: ['dart'],
    fortran: ['f', 'f90', 'f95', 'f03', 'f08', 'for', 'fpp'],
    pascal: ['pas', 'pp', 'p'],
    cobol: ['cob', 'cbl', 'ccp', 'cobol', 'cpy'],
    ada: ['adb', 'ads'],
    prolog: ['pl', 'pro'], // 注意：.pl 与 Perl 冲突
    scratch: ['sb', 'sb2', 'sb3'],
    // 文本类
    text: ['txt', 'log', 'text', 'readme'],
};

export interface FileInfo {
    path: string;
    name: string;
    stem: string;
    ext: string;
}

export function splitPath(path: string): FileInfo {
    const sep = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    const name = path.slice(sep + 1);
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
    return { path, name, stem, ext };
}

export function isImageExt(ext: string): boolean {
    return IMAGE_EXTS.includes(ext.toLowerCase());
}

export function extToLanguage(ext: string, availableLangs: string[]): string | null {
    const lower = ext.toLowerCase();
    for (const [lang, exts] of Object.entries(LANG_EXT_MAP)) {
        if (exts.includes(lower) && availableLangs.includes(lang)) {
            return lang;
        }
    }
    return null;
}

export interface DroppedFileResult {
    blocks: Block[];
    unsupported: string[];
}

export async function processDroppedFiles(
    paths: string[],
    codeLanguages: string[],
    importImage: (src: string) => Promise<ImportedImage>,
): Promise<DroppedFileResult> {
    const blocks: Block[] = [];
    const unsupported: string[] = [];

    for (const path of paths) {
        const info = splitPath(path);

        if (isImageExt(info.ext)) {
            try {
                const imported = await importImage(path);
                blocks.push({
                    type: 'image',
                    uid: newUid(),
                    title: info.stem,
                    relativePath: imported.relativePath,
                    width: 80,
                });
            } catch {
                unsupported.push(info.name);
            }
            continue;
        }

        const lang = extToLanguage(info.ext, codeLanguages);
        if (lang) {
            try {
                const content = await invoke<string>('read_text_file', { path });
                blocks.push({
                    type: 'code',
                    uid: newUid(),
                    title: info.name,
                    language: lang,
                    code: content,
                });
            } catch {
                unsupported.push(info.name);
            }
            continue;
        }

        unsupported.push(info.name);
    }

    return { blocks, unsupported };
}