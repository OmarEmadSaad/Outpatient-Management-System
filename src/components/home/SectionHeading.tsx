export default function SectionHeading({ title }: { title: string }) {
  return (
    <div className="container mx-auto px-4 flex justify-center items-center">
      <div className="xl:w-[470px] w-full">
        <h2 className="heading text-center">{title}</h2>
        <p className="text__para text-center mt-4">
          World-class care for everyone. Our health system offers unmatched,
          expert health care.
        </p>
      </div>
    </div>
  );
}
