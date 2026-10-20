import type { Block, CodeLanguage } from '../types/lab-config';

export const EMPTY_BLOCKS: Block[] = [];

/**
 * 语言 → 后缀名默认值（不含点，小写）。
 * 冲突处理：
 * - .v → V 语言；Verilog 使用 .vh/.sv/.svh
 * - .m → Objective-C；MATLAB 用户可手动补充
 * - .pl → Perl；Prolog 使用 .pro
 * - .cls → LaTeX；Visual Basic 无扩展名用户可手动补充
 * - .p → Pascal
 * - .S（大写）与 .s 冲突，忽略
 */
export const DEFAULT_LANG_EXTS: Record<string, string[]> = {
    // 主流系统/编译型语言
    java: ['java', 'jav'],
    python: ['py', 'pyw', 'pyi', 'rpy', 'gyp', 'gypi'],
    c: ['c', 'h', 'cats', 'idc'],
    cpp: [
        'cpp', 'c++', 'cc', 'cp', 'cxx', 'hpp', 'h++', 'hh', 'hxx',
        'inc', 'inl', 'ino', 'ipp', 'ixx', 're', 'tcc', 'tpp',
    ],
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
    assembly: ['asm', 's', 'nasm'],

    // JVM & .NET
    scala: ['scala', 'sc'],
    groovy: ['groovy', 'gvy', 'gy', 'gsh'],
    clojure: ['clj', 'cljs', 'cljc', 'edn'],
    fsharp: ['fs', 'fsi', 'fsx', 'fsscript'],
    visual_basic: ['vb', 'vbs', 'bas', 'frm', 'frx', 'vba', 'vbhtml'],

    // 脚本与动态语言
    javascript: ['js', 'mjs', 'cjs', 'jsx', 'es6', 'bones'],
    typescript: ['ts', 'tsx', 'mts', 'cts'],
    php: ['php', 'php3', 'php4', 'php5', 'phtml', 'ctp'],
    ruby: ['rb', 'rbx', 'rjs', 'gemspec', 'rake', 'erb', 'rhtml'],
    perl: ['pl', 'pm', 'pod'],
    lua: ['lua', 'rockspec'],
    shell: ['sh', 'bash', 'zsh', 'fish', 'ksh', 'csh'],
    powershell: ['ps1', 'psm1', 'psd1'],
    batch: ['bat', 'cmd'],
    tcl: ['tcl', 'tk'],

    // 函数式语言
    haskell: ['hs', 'lhs'],
    elixir: ['ex', 'exs'],
    erlang: ['erl', 'hrl'],
    ocaml: ['ml', 'mli', 'mll', 'mly'],
    lisp: ['lisp', 'lsp', 'cl'],
    scheme: ['scm', 'ss', 'sls', 'sps'],
    racket: ['rkt', 'rktl'],
    julia: ['jl'],

    // 数据、配置与序列化
    json: ['json', 'jsonc', 'json5', 'geojson', 'topojson'],
    yaml: ['yml', 'yaml'],
    xml: ['xml', 'xsd', 'xsl', 'xslt', 'dtd', 'plist'],
    toml: ['toml'],
    ini: ['ini', 'cfg', 'conf', 'properties', 'gitconfig'],
    csv: ['csv', 'tsv'],
    sql: ['sql', 'ddl', 'dml'],
    graphql: ['graphql', 'gql'],
    protobuf: ['proto'],

    // 标记与样式
    html: ['html', 'htm', 'xhtml', 'shtml', 'jsp', 'asp', 'aspx', 'jshtm'],
    css: ['css', 'scss', 'sass', 'less'],
    markdown: ['md', 'markdown', 'mdown', 'mkdn', 'mkd', 'mdwn', 'mdtxt'],
    mdx: ['mdx'],
    latex: ['tex', 'ltx', 'sty', 'cls'],
    rst: ['rst'],

    // 构建、基础设施
    dockerfile: ['dockerfile', 'containerfile'],
    terraform: ['tf', 'tfvars', 'hcl'],
    cmake: ['cmake'],
    makefile: ['mk', 'mak', 'make'],
    nginx: ['nginx', 'nginxconf'],
    apache: ['htaccess', 'htpasswd'],

    // 其他领域特定语言
    solidity: ['sol'],
    verilog: ['vh', 'sv', 'svh'],
    vhdl: ['vhd', 'vhdl'],
    matlab: ['rhistory', 'rmd', 'rprofile', 'rt'],
    r: ['r', 'rhistory', 'rmd', 'rprofile', 'rt'],
    dart: ['dart'],
    fortran: ['f', 'f90', 'f95', 'f03', 'f08', 'for', 'fpp'],
    pascal: ['pas', 'pp', 'p'],
    cobol: ['cob', 'cbl', 'ccp', 'cobol', 'cpy'],
    ada: ['adb', 'ads'],
    prolog: ['pro'],

    // 文本
    text: ['txt', 'log', 'text', 'readme'],
};

export const DEFAULT_CODE_LANGUAGES: CodeLanguage[] = [
    { name: 'java' },
    { name: 'python' },
    { name: 'c' },
    { name: 'cpp' },
    { name: 'csharp' },
    { name: 'javascript' },
    { name: 'typescript' },
    { name: 'text' },
];

/** 兼容旧格式（codeLanguages 是 string[]）并补齐默认值。 */
export function normalizeCodeLanguages(raw: unknown): CodeLanguage[] {
    if (!Array.isArray(raw)) return [...DEFAULT_CODE_LANGUAGES];
    const result: CodeLanguage[] = [];
    for (const item of raw) {
        if (typeof item === 'string') {
            result.push({ name: item });
        } else if (
            item &&
            typeof item === 'object' &&
            typeof (item as { name?: unknown }).name === 'string'
        ) {
            const obj = item as { name: string; extensions?: unknown };
            result.push({
                name: obj.name,
                extensions: Array.isArray(obj.extensions)
                    ? obj.extensions.filter((e): e is string => typeof e === 'string')
                    : undefined,
            });
        }
    }
    return result.length > 0 ? result : [...DEFAULT_CODE_LANGUAGES];
}