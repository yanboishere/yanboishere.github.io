import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { BookOpen, GitPullRequest, Github, Globe, Map as MapIcon, Star } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import ContributionRidge from "@/components/ContributionRidge";
import { contributionAsOf, contributionStart, contributionTotal } from "@/data/contributions";
import {
  communities,
  contributionExtras,
  contributions,
  hackathons,
  products,
  sideWorks,
  stats,
  tutorialExtras,
  tutorials,
  type Contribution,
  type LinkKind,
  type RichText,
  type WorkItem,
  type WorkLink,
} from "@/data/works";

const ICONS: Record<LinkKind, typeof Github> = {
  github: Github,
  site: Globe,
  post: BookOpen,
  page: MapIcon,
  pr: GitPullRequest,
};

const SECTIONS = [
  { id: "products", nav: "产品", title: "做过的产品 🛠️" },
  { id: "tutorials", nav: "翻译和教程", title: "翻译和教程 📚" },
  { id: "hackathons", nav: "黑客松", title: "黑客松作品 🏁" },
  { id: "side-projects", nav: "小东西", title: "顺手做的小东西 🧩" },
  { id: "open-source", nav: "开源贡献", title: "开源贡献 🤝" },
  { id: "communities", nav: "社区", title: "建过的社区 🏕️" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const fmt = (n: number) => n.toLocaleString("en-US");
const yearMonth = (iso: string) => `${iso.slice(0, 4)} 年 ${Number(iso.slice(5, 7))} 月`;

const linkClass =
  "inline-flex items-center gap-1.5 rounded-sm text-forest-700 underline-offset-4 hover:underline dark:text-forest-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500";

const rowClass =
  "grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-4 border-b border-warm-200/70 py-6 last:border-b-0 dark:border-gray-800/70 md:grid-cols-[6rem_minmax(0,1fr)] md:gap-x-6";

function WorkLinkView({ link }: { link: WorkLink }) {
  const Icon = ICONS[link.kind];
  const body = (
    <>
      <Icon size={14} aria-hidden="true" />
      {link.label}
    </>
  );
  if (link.href.startsWith("/")) {
    return (
      <Link to={link.href} className={linkClass}>
        {body}
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {body}
    </a>
  );
}

function Links({ links }: { links: WorkLink[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {links.map((l) => (
        <WorkLinkView key={l.href} link={l} />
      ))}
    </div>
  );
}

function formatStars(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(1)} 万` : fmt(n);
}

function StarCount({ n, size = 13, className = "" }: { n: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-warm-700 dark:text-warm-400 ${className}`} title={`${fmt(n)} 个 star`}>
      <Star size={size} className="fill-current" aria-hidden="true" />
      <span className="font-digits">{formatStars(n)}</span>
      <span className="sr-only">个 star</span>
    </span>
  );
}

function WorkRow({ item }: { item: WorkItem }) {
  return (
    <li className={rowClass}>
      <span className="font-digits text-lg leading-7 text-coffee/80 dark:text-warm-300/80">{item.date}</span>
      <div>
        <h3 className="font-display text-lg font-bold leading-7 text-gray-900 dark:text-gray-100 md:text-xl">
          {item.title}
          {item.stars !== undefined && item.stars >= 100 && (
            <StarCount n={item.stars} className="ml-3 align-[1px] text-sm font-normal" />
          )}
        </h3>
        {item.context && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{item.context}</p>}
        <p className="mt-2 max-w-[36em] leading-relaxed text-gray-700 dark:text-gray-300">{item.description}</p>
        <Links links={item.links} />
      </div>
    </li>
  );
}

function ContributionRow({ c }: { c: Contribution }) {
  return (
    <li className={rowClass}>
      <StarCount n={c.stars} size={14} className="self-start text-lg leading-7" />
      <div>
        <h3 className="font-display text-lg font-bold leading-7 text-gray-900 dark:text-gray-100 md:text-xl">
          {c.project}
        </h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{c.merged}</p>
        <p className="mt-2 max-w-[36em] leading-relaxed text-gray-700 dark:text-gray-300">{c.description}</p>
        <Links links={c.links} />
      </div>
    </li>
  );
}

function Rich({ parts }: { parts: RichText }) {
  return (
    <p className="mt-4 max-w-[36em] leading-loose text-gray-600 dark:text-gray-400">
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <a
            key={i}
            href={p[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest-700 underline decoration-warm-300 underline-offset-4 hover:decoration-forest-500 dark:text-forest-400 dark:decoration-gray-600"
          >
            {p[0]}
          </a>
        ),
      )}
    </p>
  );
}

function Section({ id, intro, children }: { id: SectionId; intro?: string; children: ReactNode }) {
  const title = SECTIONS.find((s) => s.id === id)?.title ?? "";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 pt-16">
      <h2 id={`${id}-title`} className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-[36em] leading-relaxed text-gray-500 dark:text-gray-400">{intro}</p>}
      {children}
    </section>
  );
}

export default function Works() {
  const reduceMotion = useReducedMotion();

  const jump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <header className="mb-10">
            <h1 className="mb-3 font-display text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl">作品 🧰</h1>
            <p className="max-w-[34em] text-lg text-gray-500 dark:text-gray-400">
              过去五年在 GitHub 上做的东西：自己的产品、翻译和教程、黑客松作品，还有给别人的开源项目交的 PR。
            </p>
          </header>

          <figure>
            <ContributionRidge />
            <figcaption className="mt-1 text-sm leading-relaxed text-gray-400 dark:text-gray-500">
              从 {yearMonth(contributionStart)}到 {yearMonth(contributionAsOf)}，每周在 GitHub 上的贡献数，一共{" "}
              <span className="font-digits text-base">{fmt(contributionTotal)}</span>{" "}
              次。高度取了平方根，不然后面几年就贴地了。
            </figcaption>
          </figure>

          <nav aria-label="这一页的目录" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => jump(e, s.id)}
                className="rounded-sm text-gray-500 underline-offset-4 hover:text-forest-700 hover:underline dark:text-gray-400 dark:hover:text-forest-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500"
              >
                {s.nav}
              </a>
            ))}
          </nav>

          <Section id="products">
            <ul className="mt-4">
              {products.map((item) => (
                <WorkRow key={item.id} item={item} />
              ))}
            </ul>
          </Section>

          <Section id="tutorials" intro="大多放在我建的 Web3-Club 下面，翻译的都是英文社区里常用的入门教程。">
            <ul className="mt-4">
              {tutorials.map((item) => (
                <WorkRow key={item.id} item={item} />
              ))}
            </ul>
            <Rich parts={tutorialExtras} />
          </Section>

          <Section id="hackathons" intro="2023 年打得最多，十几场。我写代码不算多，主要做产品、测试和写文档。">
            <ul className="mt-4">
              {hackathons.map((item) => (
                <WorkRow key={item.id} item={item} />
              ))}
            </ul>
          </Section>

          <Section id="side-projects">
            <ul className="mt-4">
              {sideWorks.map((item) => (
                <WorkRow key={item.id} item={item} />
              ))}
            </ul>
          </Section>

          <Section id="open-source" intro="在别人的项目里已经合并的 PR，按项目的 star 数排。">
            <ul className="mt-4">
              {contributions.map((c) => (
                <ContributionRow key={c.id} c={c} />
              ))}
            </ul>
            <Rich parts={contributionExtras} />
          </Section>

          <Section id="communities">
            <ul className="mt-4">
              {communities.map((item) => (
                <WorkRow key={item.id} item={item} />
              ))}
            </ul>
          </Section>

          <p className="mt-20 max-w-[36em] text-sm leading-relaxed text-gray-400 dark:text-gray-500">
            数据来自 GitHub 的公开记录，star 数和 PR 数统计到 {stats.asOf}。自己账号下有 {stats.ownRepos}{" "}
            个公开仓库，在别人的 {stats.othersMergedRepos} 个仓库里合并过 {stats.othersMergedPrs} 个 PR。
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
