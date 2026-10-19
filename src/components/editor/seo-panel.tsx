"use client";

import type { JSONContent } from "@tiptap/react";
import { hasHeading2, imagesMissingAlt } from "@/lib/editor/content";
import { LEDE_MAX, postPath } from "@/lib/seo";
import { site } from "@/lib/site";

export function SeoPanel({
  username,
  title,
  lede,
  content,
}: {
  username: string;
  title: string;
  lede: string;
  content: JSONContent;
}) {
  const description = lede.trim();
  const missingAlts = imagesMissingAlt(content);
  const notices = [
    !description ? "한 줄 결론이 없으면 검색 설명은 본문 앞부분으로 대체됩니다." : null,
    !hasHeading2(content) ? "소제목(H2)이 없습니다. 문단을 나누면 검색과 화면 낭독에 유리합니다." : null,
    missingAlts > 0 ? `설명이 없는 이미지가 ${missingAlts}장 있습니다.` : null,
  ].filter((notice): notice is string => notice !== null);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-[#e4d9c8] bg-white px-4 py-3">
        <p className="text-xs text-[#8a7b68]">검색 미리보기</p>
        <p className="mt-1 truncate text-lg text-[#1a0dab]">{title.trim() || "제목"}</p>
        <p className="truncate text-xs text-[#006621]">
          {site.url.replace(/^https:\/\//, "")}
          {postPath(username, "글-주소")}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-[#545454]">
          {description || "한 줄 결론이 여기에 표시됩니다."}
        </p>
      </div>
      {notices.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-[#8a5a12]">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      )}
      <p className="text-right text-xs text-[#8a7b68]">
        {lede.trim().length}/{LEDE_MAX}
      </p>
    </div>
  );
}
