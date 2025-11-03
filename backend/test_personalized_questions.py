"""
Test script to demonstrate personalized question generation
"""
import asyncio
from ai_services import AIInterviewer

# Sample resume data
sample_resume = {
    'name': 'John Doe',
    'skills': ['Python', 'React', 'Node.js', 'AWS', 'Docker', 'MongoDB', 'TensorFlow'],
    'experience': [
        {
            'company': 'Google',
            'title': 'Senior Software Engineer',
            'duration': '2021-2023',
            'responsibilities': [
                'Led development of Kubernetes infrastructure',
                'Improved system performance by 40%'
            ],
            'technologies': ['Python', 'Kubernetes', 'GCP']
        },
        {
            'company': 'Microsoft',
            'title': 'Software Developer',
            'duration': '2019-2021',
            'responsibilities': [
                'Built cloud-native applications',
                'Mentored junior developers'
            ],
            'technologies': ['C#', 'Azure', '.NET']
        }
    ],
    'projects': [
        {
            'name': 'E-commerce Platform',
            'description': 'Built scalable online shopping system with real-time inventory',
            'technologies': ['React', 'Node.js', 'MongoDB', 'Redis'],
            'achievements': ['Handled 10K concurrent users', 'Reduced load time by 60%']
        },
        {
            'name': 'ML Recommendation Engine',
            'description': 'Developed personalized product recommendation system',
            'technologies': ['Python', 'TensorFlow', 'AWS SageMaker'],
            'achievements': ['Improved user engagement by 35%', 'Processed 1M+ recommendations daily']
        }
    ]
}

sample_candidate_info = {
    'name': 'John Doe',
    'role': 'Senior Software Engineer',
    'experience': 'senior',
    'skills': sample_resume['skills'],
    'projects': sample_resume['projects']
}

async def test_personalized_questions():
    """Test question generation with resume context"""
    print("=" * 80)
    print("TESTING PERSONALIZED QUESTION GENERATION")
    print("=" * 80)
    
    conversation_history = []
    sections = ['greeting', 'resume', 'projects', 'behavioral', 'technical']
    
    for section in sections:
        print(f"\n{'='*80}")
        print(f"SECTION: {section.upper()}")
        print(f"{'='*80}\n")
        
        # Generate 2 questions per section
        for i in range(2):
            try:
                result = await AIInterviewer.generate_question(
                    section=section,
                    previous_answer="I have extensive experience working with distributed systems and cloud infrastructure." if conversation_history else "",
                    resume_data=sample_resume,
                    conversation_history=conversation_history,
                    candidate_info=sample_candidate_info
                )
                
                question = result['question']
                style = result.get('questionStyle', 'unknown')
                
                print(f"Question {i+1} (Style: {style}):")
                print(f"  {question}")
                print()
                
                # Add to history
                conversation_history.append({
                    'type': 'question',
                    'text': question,
                    'section': section,
                    'questionStyle': style
                })
                
                # Simulate answer
                conversation_history.append({
                    'type': 'answer',
                    'text': 'Sample answer to demonstrate conversation flow.'
                })
                
            except Exception as e:
                print(f"  Error: {e}")
                break
    
    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80)
    print(f"\nTotal questions generated: {len([c for c in conversation_history if c['type'] == 'question'])}")
    print(f"Unique styles used: {len(set([c.get('questionStyle') for c in conversation_history if c['type'] == 'question']))}")

if __name__ == "__main__":
    print("\nNOTE: This test requires API keys to be configured in .env")
    print("It will demonstrate how questions reference specific resume details.\n")
    
    asyncio.run(test_personalized_questions())
