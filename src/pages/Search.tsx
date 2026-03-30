import SearchInterface from "@/components/SearchInterface";
import APITest from "@/components/APITest";

const Search = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <SearchInterface />
        <div className="mt-16">
          <APITest />
        </div>
      </div>
    </div>
  );
};

export default Search;