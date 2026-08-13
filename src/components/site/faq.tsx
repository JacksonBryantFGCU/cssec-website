/**
 * "Questions people actually ask".
 *
 * The questions and answers are the approved design's own copy, kept in code
 * rather than modelled in Sanity. That is a deliberate reading of the existing
 * content rule: the CMS holds things that change during a semester — events,
 * resources, deadlines — while the club's standing answers about fees, majors
 * and experience change roughly never, and giving them a schema would add an
 * admin module nobody would open twice a year.
 *
 * The design renders each question and answer as plain stacked text rather than
 * as an accordion, and at four short entries there is nothing to collapse — so
 * this is a definition list, which is what a list of question/answer pairs
 * actually is. No disclosure widget, no `aria-expanded`, nothing to get wrong
 * with the keyboard.
 */
const FAQS: { question: string; answer: string }[] = [
  {
    question: 'Do I need to know how to code?',
    answer:
      'No. Most sessions assume nothing, and every project has roles marked "no experience required".',
  },
  {
    question: 'Is there a fee or an application?',
    answer:
      'Neither. Show up to a meeting, or say hello in Discord first if that is easier.',
  },
  {
    question: 'Can non-CS majors join?',
    answer: 'Yes. We have members from business, biology, and marketing on project teams.',
  },
  {
    question: 'What if I can only come sometimes?',
    answer: 'That is normal. The archive exists so you can catch up on anything you miss.',
  },
]

export function Faq() {
  return (
    <dl className="mt-4 flex flex-col">
      {FAQS.map((faq) => (
        <div className="border-rule flex flex-col gap-1.5 border-b py-3.5 last:border-b-0" key={faq.question}>
          <dt className="text-ink text-[15px] font-semibold">{faq.question}</dt>
          <dd className="text-ink-soft m-0 text-[13.5px] leading-relaxed">{faq.answer}</dd>
        </div>
      ))}
    </dl>
  )
}
