import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { REALTIME_DATA_POLICY } from "@/lib/realtime-data-policy";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="pt-10">
          <p className="text-sm font-semibold text-sky-700">本地可运行 v0.1</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
            塑料材料行业外贸客户开发工作台
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            用于辅助手动寻找真实海外客户、保存公开来源、生成搜索词，并整理可复制给 ChatGPT 的客户分析
            Prompt 与英文开发信 Prompt。
          </p>
          <div className="mt-8">
            <LinkButton href="/dashboard">进入工作台</LinkButton>
          </div>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">v0.1 数据原则</h2>
          <p className="mt-2 text-sm text-slate-600">
            当前版本只辅助实盘找客户，不自动抓取数据，不连接数据库、外部 API、AI API 或邮箱群发。
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            {REALTIME_DATA_POLICY.map((item) => (
              <li className="rounded-md bg-slate-50 px-3 py-2" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </main>
  );
}
