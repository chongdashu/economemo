import NavBar from '@/components/NavBar';

export default function Home() {
    return (
        <>
            <NavBar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl">Welcome to Economemo</h1>
            </div>
        </>
    );
}
