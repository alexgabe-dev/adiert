import { Fragment, type ReactNode } from 'react';
import Image from 'next/image';
import { articleDocument, type ArticleNode } from '@/features/news/content';

function renderNode(node: ArticleNode, key: number): ReactNode {
  const children = node.content?.map(renderNode);
  const style = { textAlign: node.attrs?.textAlign ?? undefined };
  switch (node.type) {
    case 'text': {
      let text: ReactNode = node.text;
      for (const mark of node.marks ?? []) {
        switch (mark.type) {
          case 'bold':
            text = <strong>{text}</strong>;
            break;
          case 'italic':
            text = <em>{text}</em>;
            break;
          case 'underline':
            text = <u>{text}</u>;
            break;
          case 'strike':
            text = <s>{text}</s>;
            break;
          case 'code':
            text = <code>{text}</code>;
            break;
          case 'link':
            text = (
              <a href={mark.attrs?.href} target="_blank" rel="noopener noreferrer">
                {text}
              </a>
            );
            break;
        }
      }
      return <Fragment key={key}>{text}</Fragment>;
    }
    case 'paragraph':
      return (
        <p key={key} style={style}>
          {children?.length ? children : <br />}
        </p>
      );
    case 'heading':
      return node.attrs?.level === 3 ? (
        <h3 key={key} style={style}>
          {children}
        </h3>
      ) : (
        <h2 key={key} style={style}>
          {children}
        </h2>
      );
    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'orderedList':
      return (
        <ol key={key} start={node.attrs?.start}>
          {children}
        </ol>
      );
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;
    case 'horizontalRule':
      return <hr key={key} />;
    case 'hardBreak':
      return <br key={key} />;
    case 'image':
      return (
        <figure key={key}>
          <Image
            src={node.attrs!.src!}
            alt={node.attrs?.alt ?? ''}
            width={node.attrs?.width ?? 1200}
            height={node.attrs?.height ?? 800}
            unoptimized
            className="h-auto w-full rounded-xl"
          />
          {node.attrs?.title && <figcaption>{node.attrs.title}</figcaption>}
        </figure>
      );
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
}

export function ArticleContent({ content }: { content: string }) {
  return <div className="article-content">{articleDocument(content).content?.map(renderNode)}</div>;
}
