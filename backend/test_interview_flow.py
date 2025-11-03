#!/usr/bin/env python3
"""
Test the complete interview flow to see if questions and feedback work
"""

import asyncio
import sys
from ai_services import AIInterviewer, FeedbackGenerator

async def test_question_generation():
    """Test if question generation works"""
    print("\n" + "="*60)
    print("🧪 Testing Question Generation")
    print("="*60)
    
    try:
        # Mock resume data
        resume_data = {
            'name': 'John Doe',
            'skills': ['Python', 'React', 'AWS'],
            'projects': [
                {
                    'name': 'E-commerce Platform',
                    'description': 'Built a full-stack e-commerce platform',
                    'technologies': ['React', 'Node.js', 'MongoDB']
                }
            ],
            'experience': [
                {
                    'company': 'TechCorp',
                    'title': 'Software Engineer',
                    'responsibilities': ['Built features', 'Fixed bugs']
                }
            ]
        }
        
        candidate_info = {
            'name': 'John Doe',
            'role': 'software-engineer',
            'experience': 'mid-level',
            'skills': ['Python', 'React', 'AWS'],
            'projects': resume_data['projects']
        }
        
        # Test first question
        print("\n📝 Generating first question...")
        result = await AIInterviewer.generate_question(
            section='greeting',
            previous_answer='',
            resume_data=resume_data,
            conversation_history=[],
            candidate_info=candidate_info
        )
        
        if result and result.get('question'):
            print(f"✅ First question generated:")
            print(f"   {result['question']}")
            print(f"   Section: {result.get('section')}")
            print(f"   Style: {result.get('questionStyle')}")
            
            # Test second question
            print("\n📝 Generating second question...")
            conversation_history = [
                {'type': 'question', 'text': result['question'], 'section': 'greeting'},
                {'type': 'answer', 'text': 'I am a software engineer with 3 years of experience in full-stack development.'}
            ]
            
            result2 = await AIInterviewer.generate_question(
                section='resume',
                previous_answer='I am a software engineer with 3 years of experience in full-stack development.',
                resume_data=resume_data,
                conversation_history=conversation_history,
                candidate_info=candidate_info
            )
            
            if result2 and result2.get('question'):
                print(f"✅ Second question generated:")
                print(f"   {result2['question']}")
                print(f"   Section: {result2.get('section')}")
                print(f"   Style: {result2.get('questionStyle')}")
                return True
            else:
                print("❌ Second question generation failed")
                return False
        else:
            print("❌ First question generation failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_feedback_generation():
    """Test if feedback generation works"""
    print("\n" + "="*60)
    print("🧪 Testing Feedback Generation")
    print("="*60)
    
    try:
        # Mock conversation history
        conversation_history = [
            {'type': 'question', 'text': 'Tell me about yourself', 'section': 'greeting'},
            {'type': 'answer', 'text': 'I am a software engineer with 3 years of experience.'},
            {'type': 'question', 'text': 'What projects have you worked on?', 'section': 'projects'},
            {'type': 'answer', 'text': 'I built an e-commerce platform using React and Node.js.'},
            {'type': 'question', 'text': 'What was the biggest challenge?', 'section': 'projects'},
            {'type': 'answer', 'text': 'Scaling the database to handle high traffic was challenging.'}
        ]
        
        resume_data = {
            'name': 'John Doe',
            'skills': ['Python', 'React', 'AWS']
        }
        
        candidate_info = {
            'name': 'John Doe',
            'role': 'software-engineer'
        }
        
        print("\n📊 Generating feedback...")
        feedback = await FeedbackGenerator.generate_feedback(
            conversation_history=conversation_history,
            resume_data=resume_data,
            candidate_info=candidate_info
        )
        
        if feedback and feedback.get('scores'):
            print(f"✅ Feedback generated:")
            print(f"   Overall Score: {feedback['scores'].get('overall')}/100")
            print(f"   Communication: {feedback['scores'].get('communication')}/100")
            print(f"   Technical: {feedback['scores'].get('technical')}/100")
            print(f"   Recommendation: {feedback.get('recommendation')}")
            print(f"   Strengths: {len(feedback.get('strengths', []))} items")
            print(f"   Improvements: {len(feedback.get('improvements', []))} items")
            return True
        else:
            print("❌ Feedback generation failed")
            print(f"   Result: {feedback}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    print("\n" + "="*60)
    print("🚀 INTERVIEW FLOW TEST")
    print("="*60)
    
    results = {}
    
    # Test question generation
    results['Questions'] = await test_question_generation()
    
    # Test feedback generation
    results['Feedback'] = await test_feedback_generation()
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST RESULTS")
    print("="*60)
    
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n✅ All tests passed! Interview system is working!")
    else:
        print("\n❌ Some tests failed. Check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
