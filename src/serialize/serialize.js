import { getHTMLFromFragment } from '@tiptap/core';
import { defaultMarkdownSerializer, MarkdownSerializer } from 'prosemirror-markdown';
import { Fragment } from 'prosemirror-model';


function getHTMLSerializer(schema) {
    return (state, node) => {
        const html = getHTMLFromFragment(Fragment.from(node), schema);
        state.write(html);
    }
}

function getNodes(schema, { html, bulletListMarker = '*' }) {
    const { nodes } = defaultMarkdownSerializer;
    return {
        ...Object.fromEntries(
            Object.entries(schema.nodes).map(([name, node]) => [
                name,
                html ? getHTMLSerializer(schema) : (state) => state.write(`[${name}]`)
            ])
        ),
        blockquote: nodes.blockquote,
        codeBlock: nodes.code_block,
        heading: nodes.heading,
        horizontalRule: nodes.horizontal_rule,
        bulletList(state, node) {
            return state.renderList(node, "  ", () => (bulletListMarker || "*") + " ");
        },
        orderedList: nodes.ordered_list,
        listItem: nodes.list_item,
        paragraph: nodes.paragraph,
        image: nodes.image,
        hardBreak: nodes.hard_break,
        text: nodes.text,
        table(state, node) {
            node.content.content.forEach((row, i) => {
                row.content.content.forEach((col, j) => {
                    if(j) {
                        state.write(' | ');
                    }
                    const cellContent = col.content.content[0];
                    if(cellContent.textContent.trim()) {
                        state.renderInline(cellContent);
                    } else {
                        state.write('&nbsp;');
                    }
                });
                state.ensureNewLine();
                if(!i) {
                    const delimiterRow = row.content.content.map(() => '---').join(' | ');
                    state.write(delimiterRow);
                    state.ensureNewLine();
                }
            });
            state.closeBlock(node);
        },
    }
}

function getMarks() {
    const { marks } = defaultMarkdownSerializer;
    return {
        bold: marks.strong,
        italic: marks.em,
        underline: {open:'<u>', close:'</u>'},
        strike: {open:'~~', close:'~~'},
        code: marks.code,
        link: marks.link,
    }
}

export function serialize(schema, content, {
    html,
    tightLists = false,
    bulletListMarker = '*',
} = {}) {
    const serializer = new MarkdownSerializer(getNodes(schema, { html, bulletListMarker }), getMarks());
    return serializer.serialize(content, { tightLists });
}
