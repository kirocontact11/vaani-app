export interface NewsItem {
  date: string;
  source: string;
  href: string;
  title: string;
  body: string;
}

export const NEWS: NewsItem[] = [
  {
    date: "1 September 2024",
    source: "The Indian Express",
    href: "https://indianexpress.com",
    title: "Filing a police complaint about child abuse still takes hours",
    body: "The Bombay High Court pulled up the police for acting only after public pressure. If you ever need to file a complaint, this explains the delays families face and what to expect.",
  },
  {
    date: "23 September 2024",
    source: "Supreme Court of India",
    href: "https://main.sci.gov.in",
    title: "Just having or watching child abuse material is a crime",
    body: "The Supreme Court made clear the law covers keeping and watching such material, not only sharing it. It matters if you ever find something worrying on your child’s phone.",
  },
  {
    date: "11 January 2024",
    source: "Madras High Court",
    href: "https://www.mhc.tn.gov.in",
    title: "Watching it privately is still punishable",
    body: "The court confirmed that watching such material alone at home is still an offence. We keep a simple summary of what this means for your family and your child’s school.",
  },
];
