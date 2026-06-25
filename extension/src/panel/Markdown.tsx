// Renders the extracted Markdown as rich text for the side-panel preview.
// The Markdown is derived from an arbitrary web page, so it is UNTRUSTED: react-markdown's
// default (no raw HTML) is kept on purpose — do NOT add rehype-raw. KaTeX runs with
// trust:false and throwOnError:false so malformed TeX renders as an inline error rather
// than throwing inside React. Importing katex's stylesheet here is also what pulls its
// CSS + web fonts into the esbuild bundle (see build.mjs's font `loader`).
import 'katex/dist/katex.min.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, trust: false, strict: 'ignore', output: 'html' }]]}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
